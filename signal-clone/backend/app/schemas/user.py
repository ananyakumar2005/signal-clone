from datetime import datetime
from pydantic import BaseModel


class UserPublic(BaseModel):
    id: int
    phone: str
    username: str | None
    display_name: str
    avatar_url: str | None
    about: str
    is_online: bool
    last_seen: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    display_name: str | None = None
    username: str | None = None
    avatar_url: str | None = None
    about: str | None = None


class ContactOut(BaseModel):
    id: int
    contact: UserPublic
    nickname: str | None
    added_at: datetime

    model_config = {"from_attributes": True}
