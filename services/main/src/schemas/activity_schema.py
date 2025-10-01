from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from schemas.pagination_schema import Pagination


class CreateActivitySchema(BaseModel):
    type: str = Field(max_length=32)
    subject: Optional[str] = Field(default=None, max_length=256)
    description: Optional[str] = Field(default=None, max_length=2048)
    due_at: Optional[datetime] = None
    completed: bool = False
    account_id: int
    owner_user_id: Optional[int] = None
    company_id: Optional[int] = None
    contact_id: Optional[int] = None
    deal_id: Optional[int] = None

    class Config:
        from_attributes = True


class ActivitySchema(BaseModel):
    id: int | None = None
    type: Optional[str] = None
    subject: Optional[str] = None
    description: Optional[str] = None
    due_at: Optional[datetime] = None
    completed: Optional[bool] = None
    account_id: Optional[int] = None
    owner_user_id: Optional[int] = None
    company_id: Optional[int] = None
    contact_id: Optional[int] = None
    deal_id: Optional[int] = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


class FilterActivitySchema(BaseModel):
    id: int | None = None
    type: Optional[str] = None
    completed: Optional[bool] = None
    account_id: Optional[int] = None
    owner_user_id: Optional[int] = None
    company_id: Optional[int] = None
    contact_id: Optional[int] = None
    deal_id: Optional[int] = None


class ListActivitySchema(BaseModel):
    pagination: Pagination
    activities: List[ActivitySchema]


