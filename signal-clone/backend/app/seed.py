"""
Database seeder — creates 6 users, 5 conversations (3 DM + 2 group),
and ~25 seeded messages per conversation.
Demo login: phone=+15550101, OTP=123456
"""
from datetime import datetime, timedelta
import random
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import AsyncSessionLocal
from app.models.user import User
from app.models.contact import Contact
from app.models.conversation import Conversation, ConversationMember
from app.models.message import Message, MessageReceipt


SEED_USERS = [
    {"phone": "+15550101", "display_name": "Alice Chen", "about": "Building cool things 🚀", "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice"},
    {"phone": "+15550102", "display_name": "Bob Martinez", "about": "Coffee & code ☕", "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob"},
    {"phone": "+15550103", "display_name": "Carol Singh", "about": "Designer @ heart 🎨", "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Carol"},
    {"phone": "+15550104", "display_name": "Dave Kim", "about": "Backend wizard 🧙", "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Dave"},
    {"phone": "+15550105", "display_name": "Eve Johnson", "about": "Always learning 📚", "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Eve"},
    {"phone": "+15550106", "display_name": "Frank Lee", "about": "Weekend hiker 🏔️", "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Frank"},
]

DM_CONVERSATIONS = [
    # (user_index_a, user_index_b, messages)
    (0, 1, [
        (0, "Hey Bob! Are you free this week?"),
        (1, "Yeah! What's up Alice?"),
        (0, "I wanted to discuss the new feature we're building."),
        (1, "Sure, let's do a call tomorrow?"),
        (0, "Works for me. 10am?"),
        (1, "Perfect. I'll send the invite 👍"),
        (0, "Thanks! Also, did you push the latest PR?"),
        (1, "Just pushed it. Should be ready for review."),
        (0, "Great, I'll take a look now."),
        (1, "No rush, whenever you have time."),
    ]),
    (0, 2, [
        (0, "Carol, the designs look amazing! 🔥"),
        (2, "Thank you! I was going for a minimal feel."),
        (0, "The color palette is perfect."),
        (2, "I was inspired by Signal's dark theme actually."),
        (0, "Ha, fitting! Can you export the Figma assets?"),
        (2, "On it! I'll send them over shortly."),
        (0, "No rush 😊"),
        (2, "Already sent to your email."),
        (0, "Got it, thanks Carol!"),
        (2, "Anytime! Let me know if you need changes."),
    ]),
    (0, 3, [
        (3, "Alice, the DB schema looks solid."),
        (0, "Thanks Dave! Any suggestions?"),
        (3, "Maybe add an index on messages.created_at"),
        (0, "Good call, I'll add it."),
        (3, "Also, WAL mode for SQLite is a must for concurrent writes."),
        (0, "Already on it 😄"),
        (3, "Nice! What backend are you using?"),
        (0, "FastAPI with async SQLAlchemy."),
        (3, "Sweet choice. WebSockets support is clean in FastAPI."),
        (0, "Exactly why I picked it!"),
    ]),
]

GROUP_CONVERSATIONS = [
    {
        "name": "Dev Team 🛠️",
        "member_indices": [0, 1, 2, 3],
        "messages": [
            (0, "Welcome to the Dev Team group! 🎉"),
            (1, "Excited to work with everyone!"),
            (2, "Let's build something awesome."),
            (3, "I'll set up the repo structure today."),
            (0, "Sounds great Dave. Carol, can you start on the UI mockups?"),
            (2, "Already started! Will share by EOD."),
            (1, "I'll handle the API layer."),
            (0, "Perfect. Daily standup at 9am?"),
            (3, "Works for me 👍"),
            (2, "Same here!"),
            (1, "Let's do it!"),
            (0, "Awesome. First milestone: auth + chat UI."),
        ],
    },
    {
        "name": "Weekend Plans 🏕️",
        "member_indices": [0, 2, 4, 5],
        "messages": [
            (0, "Who's up for hiking this weekend? 🏔️"),
            (5, "I'm in! Which trail?"),
            (4, "Count me in too!"),
            (2, "Sounds fun, where are we going?"),
            (0, "Thinking Blue Ridge Trail. 8km round trip."),
            (5, "Perfect distance!"),
            (4, "What time are we meeting?"),
            (0, "7am at the trailhead parking lot?"),
            (2, "That's early 😅 but ok!"),
            (5, "I'll bring snacks 🍎"),
            (4, "I'll handle the water."),
            (0, "Perfect team! 🎒"),
        ],
    },
]


async def seed_if_empty():
    from app.database import init_db
    await init_db()
    async with AsyncSessionLocal() as db:
        count = await db.execute(select(func.count(User.id)))
        if count.scalar_one() > 0:
            return  # Already seeded
        await _do_seed(db)


async def _do_seed(db: AsyncSession):
    print("[*] Seeding database...")

    # Create users
    users = []
    for u in SEED_USERS:
        user = User(**u)
        db.add(user)
        users.append(user)
    await db.flush()

    # Create contacts (Alice knows everyone; all know Alice)
    alice = users[0]
    for other in users[1:]:
        db.add(Contact(owner_id=alice.id, contact_id=other.id))
        db.add(Contact(owner_id=other.id, contact_id=alice.id))
    # Bob and Carol know each other
    db.add(Contact(owner_id=users[1].id, contact_id=users[2].id))
    db.add(Contact(owner_id=users[2].id, contact_id=users[1].id))
    await db.flush()

    # Create DM conversations
    now = datetime.utcnow()
    for conv_idx, (a_idx, b_idx, msgs) in enumerate(DM_CONVERSATIONS):
        conv = Conversation(type="direct", created_by=users[a_idx].id)
        db.add(conv)
        await db.flush()
        db.add(ConversationMember(conversation_id=conv.id, user_id=users[a_idx].id))
        db.add(ConversationMember(conversation_id=conv.id, user_id=users[b_idx].id))
        await db.flush()

        base_time = now - timedelta(days=conv_idx + 1)
        for i, (sender_idx, content) in enumerate(msgs):
            msg_time = base_time + timedelta(minutes=i * 5)
            is_last = i == len(msgs) - 1
            msg = Message(
                conversation_id=conv.id,
                sender_id=users[sender_idx].id,
                content=content,
                status="read" if not is_last else "delivered",
                created_at=msg_time,
            )
            db.add(msg)
            await db.flush()

            # Add receipt for the other member
            other_idx = b_idx if sender_idx == a_idx else a_idx
            db.add(MessageReceipt(
                message_id=msg.id,
                user_id=users[other_idx].id,
                status="read" if not is_last else "delivered",
            ))
        await db.flush()

    # Create group conversations
    for g_idx, group in enumerate(GROUP_CONVERSATIONS):
        conv = Conversation(
            type="group",
            group_name=group["name"],
            created_by=alice.id,
        )
        db.add(conv)
        await db.flush()

        for m_idx, uid_idx in enumerate(group["member_indices"]):
            db.add(ConversationMember(
                conversation_id=conv.id,
                user_id=users[uid_idx].id,
                is_admin=(m_idx == 0),  # First member is admin
            ))
        await db.flush()

        base_time = now - timedelta(days=g_idx + 4, hours=2)
        for i, (sender_idx, content) in enumerate(group["messages"]):
            msg_time = base_time + timedelta(minutes=i * 3)
            msg = Message(
                conversation_id=conv.id,
                sender_id=users[sender_idx].id,
                content=content,
                status="read",
                created_at=msg_time,
            )
            db.add(msg)

    await db.commit()
    print("[+] Seeding complete! Demo login: phone=+15550101, OTP=123456")


if __name__ == "__main__":
    import asyncio
    asyncio.run(seed_if_empty())
