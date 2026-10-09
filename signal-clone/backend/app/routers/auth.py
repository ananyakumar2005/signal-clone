from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.message import OTPSession
from app.models.user import User
from app.schemas.auth import SendOTPRequest, VerifyOTPRequest, RegisterRequest, LoginRequest, TokenResponse
from app.schemas.user import UserPublic
from app.services.auth_service import create_access_token, verify_otp
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/send-otp")
async def send_otp(req: SendOTPRequest, db: AsyncSession = Depends(get_db)):
    """Create/reset an OTP session for the given phone. Mock OTP is always 123456."""
    session = OTPSession(
        phone=req.phone,
        otp="123456",
        expires_at=datetime.utcnow() + timedelta(minutes=10),
    )
    db.add(session)
    await db.commit()
    return {"message": "OTP sent (mock: 123456)"}


@router.post("/verify-otp")
async def verify_otp_endpoint(req: VerifyOTPRequest, db: AsyncSession = Depends(get_db)):
    """Verify OTP and return whether user exists (for deciding register vs login flow)."""
    if not verify_otp(req.otp):
        raise HTTPException(status_code=400, detail="Invalid OTP")
    result = await db.execute(select(User).where(User.phone == req.phone))
    user = result.scalar_one_or_none()
    return {"verified": True, "user_exists": user is not None}


@router.post("/register", response_model=TokenResponse)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user. Phone must not already exist."""
    result = await db.execute(select(User).where(User.phone == req.phone))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Phone already registered")

    user = User(
        phone=req.phone,
        display_name=req.display_name,
        avatar_url=req.avatar_url,
        about=req.about or "Hey there! I am using Signal.",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, user_id=user.id)


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Login with phone + OTP."""
    if not verify_otp(req.otp):
        raise HTTPException(status_code=400, detail="Invalid OTP")
    result = await db.execute(select(User).where(User.phone == req.phone))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found. Please register first.")
    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, user_id=user.id)


@router.get("/me", response_model=UserPublic)
async def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/logout")
async def logout():
    # JWT is stateless; client just discards the token
    return {"message": "Logged out"}
