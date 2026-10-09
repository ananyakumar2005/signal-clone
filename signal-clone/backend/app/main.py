from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.config import settings
from app.database import init_db
from app.routers import auth, users, contacts, conversations, messages, groups, ws


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    # Auto-seed if DB is fresh
    from app.seed import seed_if_empty
    await seed_if_empty()
    yield


app = FastAPI(
    title="Signal Clone API",
    description="Backend for the Signal Clone fullstack assignment",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for uploaded avatars
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(contacts.router)
app.include_router(conversations.router)
app.include_router(messages.router)
app.include_router(groups.router)
app.include_router(ws.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
