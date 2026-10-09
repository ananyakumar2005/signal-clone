from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models.user import User
from app.models.conversation import Conversation, ConversationMember
from app.models.message import Message
from app.schemas.message import ConversationOut, UpdateConversationRequest
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/conversations", tags=["conversations"])


async def _build_conv_out(conv: Conversation, current_user_id: int, db: AsyncSession) -> dict:
    """Build ConversationOut-compatible dict with last_message and unread_count."""
    # last message
    lm_result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conv.id, Message.is_deleted == False)
        .order_by(Message.created_at.desc())
        .limit(1)
        .options(selectinload(Message.sender))
    )
    last_msg = lm_result.scalar_one_or_none()

    # unread count (messages not sent by me and status != read)
    unread_result = await db.execute(
        select(func.count(Message.id)).where(
            Message.conversation_id == conv.id,
            Message.sender_id != current_user_id,
            Message.status != "read",
            Message.is_deleted == False,
        )
    )
    unread = unread_result.scalar_one()

    return {
        "id": conv.id,
        "type": conv.type,
        "group_name": conv.group_name,
        "group_avatar": conv.group_avatar,
        "created_by": conv.created_by,
        "created_at": conv.created_at,
        "members": conv.members,
        "last_message": last_msg,
        "unread_count": unread,
    }


@router.get("", response_model=list[ConversationOut])
async def list_conversations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all conversations the current user is a member of, sorted by last activity."""
    result = await db.execute(
        select(Conversation)
        .join(ConversationMember, ConversationMember.conversation_id == Conversation.id)
        .where(ConversationMember.user_id == current_user.id)
        .options(
            selectinload(Conversation.members).selectinload(ConversationMember.user)
        )
    )
    conversations = result.scalars().unique().all()

    # Build with metadata and sort by last message
    out = []
    for conv in conversations:
        data = await _build_conv_out(conv, current_user.id, db)
        out.append(data)

    out.sort(key=lambda c: c["last_message"].created_at if c["last_message"] else c["created_at"], reverse=True)
    return out


@router.get("/{conv_id}", response_model=ConversationOut)
async def get_conversation(
    conv_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Conversation)
        .where(Conversation.id == conv_id)
        .options(selectinload(Conversation.members).selectinload(ConversationMember.user))
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Verify membership
    member_ids = [m.user_id for m in conv.members]
    if current_user.id not in member_ids:
        raise HTTPException(status_code=403, detail="Not a member")

    return await _build_conv_out(conv, current_user.id, db)


class StartDirectRequest(BaseModel):
    contact_id: int


@router.post("/direct", response_model=ConversationOut)
async def start_direct(
    body: StartDirectRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get or create a direct conversation between current user and contact."""
    # Find existing direct conversation shared by both users
    my_convs = await db.execute(
        select(ConversationMember.conversation_id).where(
            ConversationMember.user_id == current_user.id
        )
    )
    my_conv_ids = [r[0] for r in my_convs.fetchall()]

    their_convs = await db.execute(
        select(ConversationMember.conversation_id).where(
            ConversationMember.user_id == body.contact_id
        )
    )
    their_conv_ids = {r[0] for r in their_convs.fetchall()}

    for cid in my_conv_ids:
        if cid in their_conv_ids:
            # Check it's a direct with exactly 2 members
            count_result = await db.execute(
                select(func.count(ConversationMember.id)).where(
                    ConversationMember.conversation_id == cid
                )
            )
            count = count_result.scalar_one()
            conv_type_result = await db.execute(
                select(Conversation.type).where(Conversation.id == cid)
            )
            ctype = conv_type_result.scalar_one()
            if count == 2 and ctype == "direct":
                result = await db.execute(
                    select(Conversation)
                    .where(Conversation.id == cid)
                    .options(selectinload(Conversation.members).selectinload(ConversationMember.user))
                )
                return await _build_conv_out(result.scalar_one(), current_user.id, db)

    # Create new direct conversation
    conv = Conversation(type="direct", created_by=current_user.id)
    db.add(conv)
    await db.flush()
    db.add(ConversationMember(conversation_id=conv.id, user_id=current_user.id))
    db.add(ConversationMember(conversation_id=conv.id, user_id=body.contact_id))
    await db.commit()

    result = await db.execute(
        select(Conversation)
        .where(Conversation.id == conv.id)
        .options(selectinload(Conversation.members).selectinload(ConversationMember.user))
    )
    return await _build_conv_out(result.scalar_one(), current_user.id, db)


@router.patch("/{conv_id}", response_model=ConversationOut)
async def update_conversation(
    conv_id: int,
    body: UpdateConversationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Conversation)
        .where(Conversation.id == conv_id)
        .options(selectinload(Conversation.members).selectinload(ConversationMember.user))
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Only admins can update group info
    member = next((m for m in conv.members if m.user_id == current_user.id), None)
    if not member or not member.is_admin:
        raise HTTPException(status_code=403, detail="Admin required")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(conv, field, value)
    await db.commit()
    return await _build_conv_out(conv, current_user.id, db)
