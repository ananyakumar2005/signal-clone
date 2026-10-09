from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models.user import User
from app.models.contact import Contact
from app.schemas.user import ContactOut
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/contacts", tags=["contacts"])


class AddContactRequest(BaseModel):
    phone: str
    nickname: str | None = None


@router.get("", response_model=list[ContactOut])
async def list_contacts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Contact)
        .where(Contact.owner_id == current_user.id)
        .options(selectinload(Contact.contact))
        .order_by(Contact.added_at.desc())
    )
    return result.scalars().all()


@router.post("", response_model=ContactOut)
async def add_contact(
    body: AddContactRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Find target user
    result = await db.execute(select(User).where(User.phone == body.phone))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="No user with that phone number")
    if target.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot add yourself")

    # Check duplicate
    existing = await db.execute(
        select(Contact).where(
            Contact.owner_id == current_user.id, Contact.contact_id == target.id
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Contact already exists")

    contact = Contact(owner_id=current_user.id, contact_id=target.id, nickname=body.nickname)
    db.add(contact)
    await db.commit()
    await db.refresh(contact)
    # Reload with relationship
    result = await db.execute(
        select(Contact)
        .where(Contact.id == contact.id)
        .options(selectinload(Contact.contact))
    )
    return result.scalar_one()


@router.delete("/{contact_id}", status_code=204)
async def remove_contact(
    contact_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Contact).where(Contact.id == contact_id, Contact.owner_id == current_user.id)
    )
    contact = result.scalar_one_or_none()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    await db.delete(contact)
    await db.commit()
