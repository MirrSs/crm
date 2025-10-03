from typing import Any, Dict, List, Optional
from pydantic import BaseModel
from datetime import datetime


class HistoryChange(BaseModel):
    field: str
    old: Any | None = None
    new: Any | None = None


class HistorySchema(BaseModel):
    id: int
    created_at: datetime | None = None
    entity_type: str
    entity_id: int
    action: str
    account_id: int | None = None
    user_id: int | None = None
    changes: List[HistoryChange] | None = None
    meta: Dict[str, Any] | None = None

    class Config:
        from_attributes = True


class ListHistorySchema(BaseModel):
    items: List[HistorySchema]
    total: int
    page: int
    limit: int


