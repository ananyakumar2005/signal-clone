# Signal Clone — Secure Messaging Platform
> Built for the Scaler SDE Fullstack Assignment. Replicating Signal's design, user experience, and core messaging workflows with modern WebSockets, Next.js (TypeScript), and FastAPI.

---

## 🚀 Live Demo & Quick Login

- **Primary Demo Login:**
  - **Phone:** `+1 555-0101`
  - **Mock OTP:** `123456` (or click **"Alice (+1-555-0101)"** on the login page for 1-click login)
- **Secondary Demo Login (Test 2-user real-time chats):**
  - **Phone:** `+1 555-0102` (Bob)
  - **Mock OTP:** `123456`

---

## 🛠️ Tech Stack

| Layer | Technology | Key Highlights |
|---|---|---|
| **Frontend** | Next.js 14 (App Router) + TypeScript | React 18, Tailwind CSS, Lucide Icons |
| **State Management** | Zustand + TanStack React Query | Real-time optimistic updates & cache management |
| **Styling & Theme** | Tailwind CSS + Custom Signal Design Tokens | Signal dark mode palette, Inter font, custom animations |
| **Backend** | Python 3.10+ / FastAPI | Async API, automatic OpenAPI / Swagger documentation |
| **Database** | SQLite + SQLAlchemy 2.0 (asyncio) + aiosqlite | Non-blocking database I/O with foreign keys and WAL mode |
| **Real-time Engine** | Native WebSockets | Custom ConnectionManager with room routing & user presence |
| **Authentication** | Passwordless Phone + OTP (JWT HS256) | Session persistence with localStorage & Bearer interceptors |
| **Deployment** | Docker & Docker Compose / Render + Vercel | Single-command container deployment |

---

## ✨ Features Implemented

### 1. Authentication & Onboarding
- **Phone Verification:** Mock OTP verification (`123456`) with session persistence.
- **Profile Creation:** Set display name and about bio.
- **1-Click Demo Profiles:** Instantly switch between Alice and Bob to test bidirectional real-time chats.

### 2. Conversation & Contact Management
- **Conversation List:** Displays one-on-one and group chats sorted by latest message activity.
- **Search & Filter:** Instant client-side search across chats and contacts, plus filter tabs (**All**, **Unread**, **Groups**).
- **Add Contact & New Chat:** Search users by name/phone number, add them to contacts, or launch a direct chat.
- **Unread Indicators:** Signal blue badge counters showing unread message counts.

### 3. Real-Time One-on-One Messaging
- **Instant Messaging:** Bidirectional message sending and receipt via WebSockets with optimistic UI updates.
- **Message Status Checkmarks:**
  - Clock icon: Sending / Pending
  - Single check (`✓`): Sent
  - Double check (`✓✓`): Delivered
  - Blue double check (`✓✓`): Read
- **Typing Indicators:** Real-time animated bouncing dots with *"Alice is typing..."*.
- **Live Presence:** Green dot online status and *"Last seen"* timestamps.
- **Date Separators & Security Banner:** Grouped by date with Signal's hallmark end-to-end encryption notice.

### 4. Group Messaging
- **Group Creation:** Multi-member group creation with custom group name and contact selector.
- **Group Info Modal:** View all members, view admin badges, promote/demote admins, add new members, and leave group.
- **System Messages:** Automatic activity messages (*"Alice created the group"*, *"Bob added Carol"*).

### 5. Signal Experience & Extras
- **Signal UI Fidelity:** Pixel-matched dark color scheme (`#121416`, `#1b1e22`, `#2c6bed`), responsive chat bubble shapes, and Inter typography.
- **Audio & Video Call Mockups:** Simulated WebRTC call modal triggered from the chat header.
- **Safety Number Verification:** View fingerprint safety numbers for cryptographically simulated verification.
- **Quoted Replies:** Click reply on any message to quote it in the composer.
- **Settings Modal:** Edit display name and about info, view privacy preferences, and explore linked devices placeholder.

---

## 🏃 Running Locally

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+
- (Optional) Docker and Docker Compose

---

### Method A: Single-Command Docker Compose
```bash
cd signal-clone
docker compose up --build
```
- Open `http://localhost:3000` in your browser.
- Backend API docs are available at `http://localhost:8000/docs`.

---

### Method B: Manual Local Setup

#### 1. Backend Setup
```bash
cd signal-clone/backend

# Create and activate virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Seed sample data (6 users, contacts, group chats, and message history)
python -m app.seed

# Start backend server
uvicorn app.main:app --reload --port 8000
```
*Backend runs on `http://localhost:8000`.*

#### 2. Frontend Setup
```bash
cd signal-clone/frontend

# Install dependencies
npm install

# Start Next.js development server
npm run dev
```
*Frontend runs on `http://localhost:3000`.*

---

## 📂 Project Architecture

```
signal-clone/
├── backend/
│   ├── app/
│   │   ├── main.py               # FastAPI application lifecycle & CORS
│   │   ├── config.py             # Settings (SECRET_KEY, DATABASE_URL)
│   │   ├── database.py           # Async SQLAlchemy engine & session factory
│   │   ├── dependencies.py       # JWT authentication & DB dependency injection
│   │   ├── models/               # SQLAlchemy ORM models (User, Contact, Conversation, Message)
│   │   ├── schemas/              # Pydantic v2 validation models
│   │   ├── routers/              # API routes (auth, users, contacts, conversations, messages, groups, ws)
│   │   ├── services/             # WebSocket manager & auth token services
│   │   └── seed.py               # Database seeder with demo users & conversations
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── app/
│   │   ├── (auth)/login/         # Phone + OTP login page & 1-click demo logins
│   │   ├── (auth)/register/      # Registration & profile onboarding
│   │   ├── (app)/layout.tsx      # App shell (Sidebar + WebSocket client)
│   │   ├── (app)/chats/          # Empty state view
│   │   └── (app)/chats/[id]/     # Active conversation view
│   ├── components/
│   │   ├── ui/                   # Avatar, Badge, Spinner
│   │   ├── sidebar/              # Sidebar, SearchBar, ConversationList, ConversationItem
│   │   ├── chat/                 # ChatHeader, MessageBubble, MessageList, MessageInput, TypingIndicator
│   │   └── modals/               # AddContactModal, NewGroupModal, GroupInfoModal, SettingsModal, CallModal
│   ├── hooks/
│   │   └── useWebSocket.ts       # Native WebSocket hook with auto-reconnect & room events
│   ├── store/
│   │   └── useStore.ts           # Zustand global state (auth, messages, typing, presence)
│   ├── lib/                      # api.ts, auth.ts, utils.ts
│   ├── types/                    # Shared TypeScript interfaces
│   └── Dockerfile
│
├── docker-compose.yml
└── README.md
```

---

## 🌐 Deployment Guide

### Deploy Backend to Render (Free Tier)
1. Fork or push this repository to GitHub.
2. In [Render Dashboard](https://dashboard.render.com/), create a new **Web Service**.
3. Point to root directory: `signal-clone/backend`.
4. Build command: `pip install -r requirements.txt`.
5. Start command: `python -m app.seed && uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
6. Add environment variables:
   - `SECRET_KEY`: `<any-strong-random-string>`
   - `CORS_ORIGINS`: `https://<your-vercel-app>.vercel.app,http://localhost:3000`

### Deploy Frontend to Vercel
1. In [Vercel Dashboard](https://vercel.com/), import the repository.
2. Set Root Directory to `signal-clone/frontend`.
3. Add Environment Variables:
   - `NEXT_PUBLIC_API_URL`: `https://<your-render-backend>.onrender.com`
4. Click **Deploy**.
