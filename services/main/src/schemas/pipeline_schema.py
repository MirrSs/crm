from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from schemas.pagination_schema import Pagination


class CreatePipelineSchema(BaseModel):
    name: str = Field(max_length=128)
    description: Optional[str] = Field(default=None, max_length=512)
    account_id: int
    owner_user_id: Optional[int] = None

    class Config:
        from_attributes = True


class PipelineSchema(BaseModel):
    id: int | None = None
    name: Optional[str] = None
    description: Optional[str] = None
    account_id: Optional[int] = None
    owner_user_id: Optional[int] = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


class FilterPipelineSchema(BaseModel):
    id: int | None = None
    name: Optional[str] = None
    account_id: Optional[int] = None
    owner_user_id: Optional[int] = None


class ListPipelineSchema(BaseModel):
    pagination: Pagination
    pipelines: List[PipelineSchema]


