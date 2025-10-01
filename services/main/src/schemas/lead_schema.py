from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from schemas.pagination_schema import Pagination


class CreateLeadSchema(BaseModel):
    first_name: Optional[str] = Field(default=None, max_length=80)
    last_name: Optional[str] = Field(default=None, max_length=80)
    email: Optional[str] = Field(default=None, max_length=120)
    phone: Optional[str] = Field(default=None, max_length=24)
    company_name: Optional[str] = Field(default=None, max_length=256)
    source: Optional[str] = Field(default=None, max_length=64)
    status: Optional[str] = Field(default=None, max_length=64)
    notes: Optional[str] = Field(default=None, max_length=1024)
    account_id: int
    owner_user_id: Optional[int] = None

    class Config:
        from_attributes = True


class LeadSchema(BaseModel):
    id: int | None = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    company_name: Optional[str] = None
    source: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    account_id: Optional[int] = None
    owner_user_id: Optional[int] = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


class FilterLeadSchema(BaseModel):
    id: int | None = None
    email: Optional[str] = None
    phone: Optional[str] = None
    source: Optional[str] = None
    status: Optional[str] = None
    account_id: Optional[int] = None
    owner_user_id: Optional[int] = None


class ListLeadSchema(BaseModel):
    pagination: Pagination
    leads: List[LeadSchema]


