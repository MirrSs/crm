from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from schemas.pagination_schema import Pagination


class CreateContactSchema(BaseModel):
    first_name: Optional[str] = Field(default=None, max_length=80)
    last_name: Optional[str] = Field(default=None, max_length=80)
    email: Optional[str] = Field(default=None, max_length=120)
    phone: Optional[str] = Field(default=None, max_length=24)
    position: Optional[str] = Field(default=None, max_length=120)
    company_id: Optional[int] = None
    account_id: int
    owner_user_id: Optional[int] = None

    class Config:
        from_attributes = True


class ContactSchema(BaseModel):
    id: int | None = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    position: Optional[str] = None
    company_id: Optional[int] = None
    account_id: Optional[int] = None
    owner_user_id: Optional[int] = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


class FilterContactSchema(BaseModel):
    id: int | None = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    company_id: Optional[int] = None
    account_id: Optional[int] = None
    owner_user_id: Optional[int] = None


class ListContactSchema(BaseModel):
    pagination: Pagination
    contacts: List[ContactSchema]


