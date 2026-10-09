from datetime import datetime
from pydantic import BaseModel
from app.schemas.user import UserPublic


class MessageReplyPreview(BaseModel):
    id: int
    content: str
    sender_id: int
    sender_name: str

    model_config = {"from_attributes": True}


class MessageOut(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    sender: UserPublic
    content: str
    message_type: str
    status: str
    reply_to_id: int | None
    reply_to: MessageReplyPreview | None
    is_deleted: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class MessageCreate(BaseModel):
    content: str
    message_type: str = "text"
    reply_to_id: int | None = None


class ConversationMemberOut(BaseModel):
    id: int
    user_id: int
    user: UserPublic
    is_admin: bool
    joined_at: datetime

    model_config = {"from_attributes": True}


class ConversationOut(BaseModel):
    id: int
    type: str
    group_name: str | None
    group_avatar: str | None
    created_by: int | None
    created_at: datetime
    members: list[ConversationMemberOut]
    last_message: MessageOut | None = None
    unread_count: int = 0

    model_config = {"from_attributes": True}


class CreateGroupRequest(BaseModel):
    group_name: str
    group_avatar: str | None = None
    member_ids: list[int]


class AddMemberRequest(BaseModel):
    user_id: int


class UpdateConversationRequest(BaseModel):
    group_name: str | None = None
    group_avatar: str | None = None
