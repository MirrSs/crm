from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional, Literal
from datetime import datetime

router = APIRouter(prefix="/conversations", tags=["conversations"])

class Conversation(BaseModel):
    id: str
    channel_id: str
    customer_id: str
    title: Optional[str] = None
    last_message_at: Optional[datetime] = None
    unread: int = 0

class Message(BaseModel):
    id: str
    conversation_id: str
    direction: Literal['in', 'out']
    text: Optional[str] = None
    created_at: datetime

class MessageCreate(BaseModel):
    text: Optional[str] = None

DB: dict = {
    "conversations": [],
    "messages": [],
}

@router.get("/")
async def list_conversations(channel_id: Optional[str] = None) -> dict:
    items = DB["conversations"]
    if channel_id:
        items = [c for c in items if c.channel_id == channel_id]
    return {"conversations": items}

@router.post("/")
async def create_conversation(channel_id: str, customer_id: str, title: Optional[str] = None) -> Conversation:
    new = Conversation(id=str(len(DB["conversations"]) + 1), channel_id=channel_id, customer_id=customer_id, title=title)
    DB["conversations"].append(new)
    return new

@router.get("/{conversation_id}/messages/")
async def list_messages(conversation_id: str) -> dict:
    items = [m for m in DB["messages"] if m.conversation_id == conversation_id]
    return {"messages": items}

@router.post("/{conversation_id}/messages/")
async def send_message(conversation_id: str, payload: MessageCreate) -> Message:
    new = Message(
        id=str(len(DB["messages"]) + 1),
        conversation_id=conversation_id,
        direction='out',
        text=payload.text,
        created_at=datetime.utcnow(),
    )
    DB["messages"].append(new)
    # update last_message_at
    for c in DB["conversations"]:
        if c.id == conversation_id:
            c.last_message_at = new.created_at
            break
    return new


