from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from schemas.pagination_schema import Pagination



class CreateAccountSchema(BaseModel):
    name: str = Field(max_length=128)

    class Config:
        from_attributes = True


class AccountMineSchema(BaseModel):
    id: int | None = None
    name: str | None = None

    country: str | None = None

    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        from_attributes = True

class AccountSchema(BaseModel):
    id: int | None = None
    name: str | None = None

    country: str | None = None

    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


class FilterAccountSchema(BaseModel):
    id: int | None = None

    name: str | None = None
    country: str | None = None


class ListAccountSchema(BaseModel):
    pagination: Pagination
    accounts: List[AccountSchema]
