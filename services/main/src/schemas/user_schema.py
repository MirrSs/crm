from pydantic import BaseModel, Field
from schemas.account_schema import AccountMineSchema
from schemas.pagination_schema import Pagination
from typing import List
from datetime import datetime


class CreateUserSchema(BaseModel):
    name: str = Field(max_length=60)
    email: str = Field(max_length=50)
    password: str
    phone: str | None = Field(default=None,max_length=24)

    account_id: int
    role: str = Field(max_length=32)

    class Config:
        from_attributes = True


class UserMineSchema(BaseModel):
    id: int | None = None
    name: str | None = None
    email: str | None = None
    account: AccountMineSchema
    account_id: int | None = None

    role: str | None = None

    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        from_attributes = True

class UserSchema(BaseModel):
    id: int | None = None
    name: str | None = None
    email: str | None = None

    account_id: int | None = None

    role: str | None = None

    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


class FilterUserSchema(BaseModel):
    id: int | None = None
    name: str | None = None
    email: str | None = None

    account_id: int | None = None

    role: str | None = None


class ListUserSchema(BaseModel):
    pagination: Pagination
    users: List[UserSchema]
