import json
import logging
from datetime import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.user import User
from app.models.conversation import ConversationMember
from app.services.ws_manager import manager
from app.services.auth_service import decode_token
from jose import JWTError

logger = logging.getLogger(__name__)
router = APIRouter(tags=["websocket"])


async def _get_user_from_token(token: str) -> User | None:
    try:
        payload = decode_token(token)
        user_id = int(payload.get("sub"))
    except (JWTError, TypeError, ValueError):
        return None

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()


@router.websocket("/ws/{user_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: int,
    token: str = Query(...),
):
    # Authenticate
    user = await _get_user_from_token(token)
    if not user or user.id != user_id:
        await websocket.close(code=4001)
        return

    await manager.connect(websocket, user_id)

    # Mark user online and broadcast presence
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.id == user_id))
        db_user = result.scalar_one_or_none()
        if db_user:
            db_user.is_online = True
            await db.commit()

    await manager.broadcast_to_conversation(
        0,  # 0 = global broadcast (all contacts); handled below
        [user_id],
        {"type": "presence.update", "user_id": user_id, "is_online": True, "last_seen": None},
    )
    # Actually broadcast to all users who share a conversation with this user
    async with AsyncSessionLocal() as db:
        conv_result = await db.execute(
            select(ConversationMember.conversation_id).where(
                ConversationMember.user_id == user_id
            )
        )
        conv_ids = [r[0] for r in conv_result.fetchall()]
        if conv_ids:
            members_result = await db.execute(
                select(ConversationMember.user_id)
                .where(ConversationMember.conversation_id.in_(conv_ids))
                .distinct()
            )
            peer_ids = [r[0] for r in members_result.fetchall() if r[0] != user_id]
            for pid in peer_ids:
                await manager.send_to_user(
                    pid,
                    {"type": "presence.update", "user_id": user_id, "is_online": True, "last_seen": None},
                )

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                event = json.loads(raw)
            except json.JSONDecodeError:
                continue

            event_type = event.get("type")

            if event_type in ("typing.start", "typing.stop"):
                conv_id = event.get("conversation_id")
                if conv_id:
                    # Broadcast to conversation members
                    async with AsyncSessionLocal() as db:
                        members_result = await db.execute(
                            select(ConversationMember.user_id).where(
                                ConversationMember.conversation_id == conv_id
                            )
                        )
                        member_ids = [r[0] for r in members_result.fetchall() if r[0] != user_id]
                    for mid in member_ids:
                        await manager.send_to_user(
                            mid,
                            {"type": event_type, "conversation_id": conv_id, "user_id": user_id},
                        )

            elif event_type == "message.read":
                message_ids = event.get("message_ids", [])
                async with AsyncSessionLocal() as db:
                    from app.models.message import Message, MessageReceipt
                    for mid in message_ids:
                        result = await db.execute(
                            select(MessageReceipt).where(
                                MessageReceipt.message_id == mid,
                                MessageReceipt.user_id == user_id,
                            )
                        )
                        receipt = result.scalar_one_or_none()
                        if receipt:
                            receipt.status = "read"
                    await db.commit()

                    # Notify senders
                    for mid in message_ids:
                        msg_result = await db.execute(
                            select(Message).where(Message.id == mid)
                        )
                        msg = msg_result.scalar_one_or_none()
                        if msg:
                            await manager.send_to_user(
                                msg.sender_id,
                                {"type": "message.status", "message_id": mid, "status": "read"},
                            )

    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(websocket, user_id)

        # Mark offline, update last_seen
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(User).where(User.id == user_id))
            db_user = result.scalar_one_or_none()
            if db_user:
                db_user.is_online = False
                db_user.last_seen = datetime.utcnow()
                await db.commit()

        # Broadcast offline to peers
        async with AsyncSessionLocal() as db:
            conv_result = await db.execute(
                select(ConversationMember.conversation_id).where(
                    ConversationMember.user_id == user_id
                )
            )
            conv_ids = [r[0] for r in conv_result.fetchall()]
            if conv_ids:
                members_result = await db.execute(
                    select(ConversationMember.user_id)
                    .where(ConversationMember.conversation_id.in_(conv_ids))
                    .distinct()
                )
                peer_ids = [r[0] for r in members_result.fetchall() if r[0] != user_id]
                now = datetime.utcnow().isoformat()
                for pid in peer_ids:
                    await manager.send_to_user(
                        pid,
                        {"type": "presence.update", "user_id": user_id, "is_online": False, "last_seen": now},
                    )

        logger.info(f"User {user_id} fully disconnected and marked offline.")
