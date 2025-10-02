from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from schemas.pagination_schema import Pagination


class CreateDealProductSchema(BaseModel):
    deal_id: int
    product_id: int
    quantity: int = Field(ge=1, default=1)
    unit_price: Optional[float] = None
    currency: Optional[str] = Field(default=None, max_length=8)
    discount_type: Optional[str] = Field(default=None, max_length=16)
    discount_value: Optional[float] = None

    class Config:
        from_attributes = True


class DealProductSchema(BaseModel):
    id: int | None = None
    deal_id: Optional[int] = None
    product_id: Optional[int] = None
    quantity: Optional[int] = None
    unit_price: Optional[float] = None
    currency: Optional[str] = None
    discount_type: Optional[str] = None
    discount_value: Optional[float] = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


class FilterDealProductSchema(BaseModel):
    id: int | None = None
    deal_id: Optional[int] = None
    product_id: Optional[int] = None


class ListDealProductSchema(BaseModel):
    pagination: Pagination
    items: List[DealProductSchema]


class CreateDealServiceSchema(BaseModel):
    deal_id: int
    service_id: int
    quantity: int = Field(ge=1, default=1)
    unit_price: Optional[float] = None
    currency: Optional[str] = Field(default=None, max_length=8)
    discount_type: Optional[str] = Field(default=None, max_length=16)
    discount_value: Optional[float] = None

    class Config:
        from_attributes = True


class DealServiceSchema(BaseModel):
    id: int | None = None
    deal_id: Optional[int] = None
    service_id: Optional[int] = None
    quantity: Optional[int] = None
    unit_price: Optional[float] = None
    currency: Optional[str] = None
    discount_type: Optional[str] = None
    discount_value: Optional[float] = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


class FilterDealServiceSchema(BaseModel):
    id: int | None = None
    deal_id: Optional[int] = None
    service_id: Optional[int] = None


class ListDealServiceSchema(BaseModel):
    pagination: Pagination
    items: List[DealServiceSchema]


