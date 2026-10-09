from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models.user import User
from app.models.conversation import Conversation, ConversationMember
from app.models.message import Message
from app.schemas.message import ConversationOut, ConversationMemberOut, CreateGroupRequest, AddMemberRequest
from app.services.ws_manager import manager
from app.dependencies import get_current_user
from app.routers.conversations import _build_conv_out

router = APIRouter(prefix="/api/groups", tags=["groups"])


@router.post("", response_model=ConversationOut)
async def create_group(
    body: CreateGroupRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conv = Conversation(
        type="group",
        group_name=body.group_name,
        group_avatar=body.group_avatar,
        created_by=current_user.id,
    )
    db.add(conv)
    await db.flush()

    # Add creator as admin
    db.add(ConversationMember(conversation_id=conv.id, user_id=current_user.id, is_admin=True))

    # Add other members
    for uid in body.member_ids:
        if uid != current_user.id:
            db.add(ConversationMember(conversation_id=conv.id, user_id=uid, is_admin=False))

    # System message
    db.add(Message(
        conversation_id=conv.id,
        sender_id=current_user.id,
        content=f"{current_user.display_name} created the group",
        message_type="system",
        status="read",
    ))
    await db.commit()

    result = await db.execute(
        select(Conversation)
        .where(Conversation.id == conv.id)
        .options(selectinload(Conversation.members).selectinload(ConversationMember.user))
    )
    conv = result.scalar_one()
    return await _build_conv_out(conv, current_user.id, db)


@router.get("/{conv_id}/members", response_model=list[ConversationMemberOut])
async def get_members(
    conv_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ConversationMember)
        .where(ConversationMember.conversation_id == conv_id)
        .options(selectinload(ConversationMember.user))
    )
    members = result.scalars().all()
    if not any(m.user_id == current_user.id for m in members):
        raise HTTPException(status_code=403, detail="Not a member")
    return members


@router.post("/{conv_id}/members", response_model=ConversationMemberOut)
async def add_member(
    conv_id: int,
    body: AddMemberRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Check current user is admin
    admin_check = await db.execute(
        select(ConversationMember).where(
            ConversationMember.conversation_id == conv_id,
            ConversationMember.user_id == current_user.id,
            ConversationMember.is_admin == True,
        )
    )
    if not admin_check.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Admin required")

    # Check not already a member
    existing = await db.execute(
        select(ConversationMember).where(
            ConversationMember.conversation_id == conv_id,
            ConversationMember.user_id == body.user_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already a member")

    member = ConversationMember(conversation_id=conv_id, user_id=body.user_id)
    db.add(member)

    # Get user name for system message
    user_result = await db.execute(select(User).where(User.id == body.user_id))
    new_user = user_result.scalar_one_or_none()
    if new_user:
        db.add(Message(
            conversation_id=conv_id,
            sender_id=current_user.id,
            content=f"{current_user.display_name} added {new_user.display_name}",
            message_type="system",
            status="read",
        ))

    await db.commit()
    result = await db.execute(
        select(ConversationMember)
        .where(ConversationMember.id == member.id)
        .options(selectinload(ConversationMember.user))
    )
    return result.scalar_one()


@router.delete("/{conv_id}/members/{user_id}", status_code=204)
async def remove_member(
    conv_id: int,
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Check current user is admin OR removing themselves
    if user_id != current_user.id:
        admin_check = await db.execute(
            select(ConversationMember).where(
                ConversationMember.conversation_id == conv_id,
                ConversationMember.user_id == current_user.id,
                ConversationMember.is_admin == True,
            )
        )
        if not admin_check.scalar_one_or_none():
            raise HTTPException(status_code=403, detail="Admin required")

    result = await db.execute(
        select(ConversationMember).where(
            ConversationMember.conversation_id == conv_id,
            ConversationMember.user_id == user_id,
        )
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    await db.delete(member)
    await db.commit()


@router.patch("/{conv_id}/members/{user_id}")
async def toggle_admin(
    conv_id: int,
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Only admins can promote/demote
    admin_check = await db.execute(
        select(ConversationMember).where(
            ConversationMember.conversation_id == conv_id,
            ConversationMember.user_id == current_user.id,
            ConversationMember.is_admin == True,
        )
    )
    if not admin_check.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Admin required")

    result = await db.execute(
        select(ConversationMember).where(
            ConversationMember.conversation_id == conv_id,
            ConversationMember.user_id == user_id,
        )
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    member.is_admin = not member.is_admin
    await db.commit()
    return {"user_id": user_id, "is_admin": member.is_admin}
