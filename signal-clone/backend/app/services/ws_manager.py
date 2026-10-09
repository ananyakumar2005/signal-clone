"""
WebSocket Connection Manager.
Maintains per-user connections and broadcasts events to conversation rooms.
"""
from collections import defaultdict
from fastapi import WebSocket
import json
import logging

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        # user_id -> list of active WebSocket connections
        self._connections: dict[int, list[WebSocket]] = defaultdict(list)
        # conversation_id -> set of user_ids
        self._rooms: dict[int, set[int]] = defaultdict(set)

    async def connect(self, websocket: WebSocket, user_id: int) -> None:
        await websocket.accept()
        self._connections[user_id].append(websocket)
        logger.info(f"User {user_id} connected. Total connections: {self._active_count()}")

    def disconnect(self, websocket: WebSocket, user_id: int) -> None:
        if websocket in self._connections[user_id]:
            self._connections[user_id].remove(websocket)
        if not self._connections[user_id]:
            del self._connections[user_id]
        logger.info(f"User {user_id} disconnected.")

    def join_room(self, conversation_id: int, user_id: int) -> None:
        self._rooms[conversation_id].add(user_id)

    def leave_room(self, conversation_id: int, user_id: int) -> None:
        self._rooms[conversation_id].discard(user_id)

    def is_online(self, user_id: int) -> bool:
        return user_id in self._connections and len(self._connections[user_id]) > 0

    async def send_to_user(self, user_id: int, payload: dict) -> None:
        """Send a JSON event to all connections of a specific user."""
        dead: list[WebSocket] = []
        for ws in list(self._connections.get(user_id, [])):
            try:
                await ws.send_text(json.dumps(payload))
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws, user_id)

    async def broadcast_to_conversation(
        self, conversation_id: int, member_ids: list[int], payload: dict
    ) -> None:
        """Broadcast to all online members of a conversation."""
        for uid in member_ids:
            await self.send_to_user(uid, payload)

    def _active_count(self) -> int:
        return sum(len(ws_list) for ws_list in self._connections.values())


# Singleton instance shared across the app
manager = ConnectionManager()
