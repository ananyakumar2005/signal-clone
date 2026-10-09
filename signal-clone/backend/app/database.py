from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:  # type: ignore[override]
    async with AsyncSessionLocal() as session:
        yield session


async def init_db() -> None:
    """Create all tables and enable WAL mode."""
    async with engine.begin() as conn:
        # Enable WAL for concurrent WebSocket writes
        await conn.execute(__import__("sqlalchemy").text("PRAGMA journal_mode=WAL"))
        from app.models import user, contact, conversation, message  # noqa: F401
        await conn.run_sync(Base.metadata.create_all)
