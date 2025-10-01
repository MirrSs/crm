from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from schemas.pagination_schema import Pagination


class CreateStageSchema(BaseModel):
    name: str = Field(max_length=128)
    probability: Optional[int] = Field(default=None, ge=0, le=100)
    order_index: int = 0
    pipeline_id: int
    is_closed_won: bool = False
    is_closed_lost: bool = False

    class Config:
        from_attributes = True


class StageSchema(BaseModel):
    id: int | None = None
    name: Optional[str] = None
    probability: Optional[int] = None
    order_index: Optional[int] = None
    pipeline_id: Optional[int] = None
    is_closed_won: Optional[bool] = None
    is_closed_lost: Optional[bool] = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


class FilterStageSchema(BaseModel):
    id: int | None = None
    name: Optional[str] = None
    pipeline_id: Optional[int] = None


class ListStageSchema(BaseModel):
    pagination: Pagination
    stages: List[StageSchema]


