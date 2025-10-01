from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from schemas.pagination_schema import Pagination


class CreateCompanySchema(BaseModel):
    name: str = Field(max_length=256)
    website: Optional[str] = Field(default=None, max_length=256)
    email: Optional[str] = Field(default=None, max_length=120)
    phone: Optional[str] = Field(default=None, max_length=24)
    country: Optional[str] = Field(default=None, max_length=64)
    city: Optional[str] = Field(default=None, max_length=64)
    address: Optional[str] = Field(default=None, max_length=256)
    account_id: int
    owner_user_id: Optional[int] = None

    class Config:
        from_attributes = True


class CompanySchema(BaseModel):
    id: int | None = None
    name: Optional[str] = None
    website: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    account_id: Optional[int] = None
    owner_user_id: Optional[int] = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


class FilterCompanySchema(BaseModel):
    id: int | None = None
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    account_id: Optional[int] = None
    owner_user_id: Optional[int] = None


class ListCompanySchema(BaseModel):
    pagination: Pagination
    companies: List[CompanySchema]


