from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from schemas.pagination_schema import Pagination


class CreateProductSchema(BaseModel):
    sku: str = Field(max_length=64)
    name: str = Field(max_length=256)
    description: Optional[str] = Field(default=None, max_length=1024)
    price: Optional[float] = None
    currency: Optional[str] = Field(default=None, max_length=8)
    account_id: int

    class Config:
        from_attributes = True


class ProductSchema(BaseModel):
    id: int | None = None
    sku: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    currency: Optional[str] = None
    account_id: Optional[int] = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


class FilterProductSchema(BaseModel):
    id: int | None = None
    sku: Optional[str] = None
    name: Optional[str] = None
    account_id: Optional[int] = None


class ListProductSchema(BaseModel):
    pagination: Pagination
    products: List[ProductSchema]


