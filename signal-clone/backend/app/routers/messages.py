from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models.user import User
from app.models.conversation import Conversation, ConversationMember
from app.models.message import Message, MessageReceipt
from app.schemas.message import MessageOut, MessageCreate
from app.services.ws_manager import manager
from app.dependencies import get_current_user
import json

router = APIRouter(prefix="/api/conversations", tags=["messages"])


async def _message_to_dict(msg: Message) -> dict:
    reply_preview = None
    if msg.reply_to:
        reply_preview = {
            "id": msg.reply_to.id,
            "content": msg.reply_to.content,
            "sender_id": msg.reply_to.sender_id,
            "sender_name": msg.reply_to.sender.display_name if msg.reply_to.sender else "",
        }
    return {
        "id": msg.id,
        "conversation_id": msg.conversation_id,
        "sender_id": msg.sender_id,
        "sender": {
            "id": msg.sender.id,
            "phone": msg.sender.phone,
            "username": msg.sender.username,
            "display_name": msg.sender.display_name,
            "avatar_url": msg.sender.avatar_url,
            "about": msg.sender.about,
            "is_online": msg.sender.is_online,
            "last_seen": msg.sender.last_seen.isoformat() if msg.sender.last_seen else None,
            "created_at": msg.sender.created_at.isoformat(),
        },
        "content": msg.content,
        "message_type": msg.message_type,
        "status": msg.status,
        "reply_to_id": msg.reply_to_id,
        "reply_to": reply_preview,
        "is_deleted": msg.is_deleted,
        "created_at": msg.created_at.isoformat(),
    }


@router.get("/{conv_id}/messages", response_model=list[MessageOut])
async def get_messages(
    conv_id: int,
    cursor: int | None = Query(None, description="Last message ID for pagination"),
    limit: int = Query(50, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verify membership
    member_check = await db.execute(
        select(ConversationMember).where(
            ConversationMember.conversation_id == conv_id,
            ConversationMember.user_id == current_user.id,
        )
    )
    if not member_check.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not a member")

    query = (
        select(Message)
        .where(Message.conversation_id == conv_id, Message.is_deleted == False)
        .options(
            selectinload(Message.sender),
            selectinload(Message.reply_to).selectinload(Message.sender),
        )
        .order_by(Message.created_at.desc())
        .limit(limit)
    )
    if cursor:
        cursor_result = await db.execute(select(Message.created_at).where(Message.id == cursor))
        cursor_time = cursor_result.scalar_one_or_none()
        if cursor_time:
            query = query.where(Message.created_at < cursor_time)

    result = await db.execute(query)
    messages = list(reversed(result.scalars().all()))
    return messages


@router.post("/{conv_id}/messages", response_model=MessageOut)
async def send_message(
    conv_id: int,
    body: MessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verify membership
    member_check = await db.execute(
        select(ConversationMember).where(
            ConversationMember.conversation_id == conv_id,
            ConversationMember.user_id == current_user.id,
        )
    )
    if not member_check.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not a member")

    msg = Message(
        conversation_id=conv_id,
        sender_id=current_user.id,
        content=body.content,
        message_type=body.message_type,
        reply_to_id=body.reply_to_id,
        status="sent",
    )
    db.add(msg)
    await db.flush()

    # Create delivery receipts for all other members
    members_result = await db.execute(
        select(ConversationMember).where(ConversationMember.conversation_id == conv_id)
    )
    members = members_result.scalars().all()
    member_ids = [m.user_id for m in members]

    for uid in member_ids:
        if uid != current_user.id:
            db.add(MessageReceipt(message_id=msg.id, user_id=uid, status="delivered"))

    await db.commit()

    # Reload with relationships
    result = await db.execute(
        select(Message)
        .where(Message.id == msg.id)
        .options(
            selectinload(Message.sender),
            selectinload(Message.reply_to).selectinload(Message.sender),
        )
    )
    msg = result.scalar_one()

    # Broadcast via WebSocket
    payload = {"type": "message.new", "message": await _message_to_dict(msg)}
    await manager.broadcast_to_conversation(conv_id, member_ids, payload)

    return msg


@router.delete("/messages/{msg_id}", status_code=204)
async def delete_message(
    msg_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Message).where(Message.id == msg_id))
    msg = result.scalar_one_or_none()
    if not msg or msg.sender_id != current_user.id:
        raise HTTPException(status_code=404, detail="Message not found or unauthorized")
    msg.is_deleted = True
    msg.content = "This message was deleted"
    await db.commit()


@router.patch("/messages/{msg_id}/status")
async def update_message_status(
    msg_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a message as read for the current user."""
    result = await db.execute(
        select(MessageReceipt).where(
            MessageReceipt.message_id == msg_id,
            MessageReceipt.user_id == current_user.id,
        )
    )
    receipt = result.scalar_one_or_none()
    if receipt:
        receipt.status = "read"
        await db.commit()

    # Notify sender via WS
    msg_result = await db.execute(select(Message).where(Message.id == msg_id))
    msg = msg_result.scalar_one_or_none()
    if msg:
        await manager.send_to_user(
            msg.sender_id,
            {"type": "message.status", "message_id": msg_id, "status": "read"},
        )
    return {"ok": True}
