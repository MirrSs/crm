from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
from schemas.pagination_schema import Pagination


class CreateDealSchema(BaseModel):
    name: str = Field(max_length=256)
    amount: Optional[float] = None
    currency: Optional[str] = Field(default=None, max_length=8)
    expected_close_date: Optional[date] = None
    account_id: int
    company_id: Optional[int] = None
    contact_id: Optional[int] = None
    pipeline_id: int
    stage_id: int
    owner_user_id: Optional[int] = None
    order_index: Optional[int] = 0
    discount_type: Optional[str] = Field(default=None, max_length=16)
    discount_value: Optional[float] = None

    class Config:
        from_attributes = True


class DealSchema(BaseModel):
    id: int | None = None
    name: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    expected_close_date: Optional[date] = None
    account_id: Optional[int] = None
    company_id: Optional[int] = None
    contact_id: Optional[int] = None
    pipeline_id: Optional[int] = None
    stage_id: Optional[int] = None
    owner_user_id: Optional[int] = None
    order_index: Optional[int] = None
    discount_type: Optional[str] = None
    discount_value: Optional[float] = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


class FilterDealSchema(BaseModel):
    id: int | None = None
    name: Optional[str] = None
    account_id: Optional[int] = None
    company_id: Optional[int] = None
    contact_id: Optional[int] = None
    pipeline_id: Optional[int] = None
    stage_id: Optional[int] = None
    owner_user_id: Optional[int] = None


class ListDealSchema(BaseModel):
    pagination: Pagination
    deals: List[DealSchema]


