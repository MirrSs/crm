from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/channels", tags=["channels"])

class Channel(BaseModel):
    id: str
    name: str
    type: str
    active: bool = True

class ChannelCreate(BaseModel):
    name: str
    type: str
    active: bool = True

DB: dict = {
    "channels": [],
}

@router.get("/")
async def list_channels() -> dict:
    return {"channels": DB["channels"]}

@router.post("/")
async def create_channel(payload: ChannelCreate) -> Channel:
    new = Channel(id=str(len(DB["channels"]) + 1), **payload.dict())
    DB["channels"].append(new)
    return new

@router.get("/{channel_id}/")
async def get_channel(channel_id: str) -> Optional[Channel]:
    return next((c for c in DB["channels"] if c.id == channel_id), None)


