from fastapi import APIRouter, Depends, status, Query
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from db.postgres.db import get_session
from db.transaction import transaction
from schemas.pagination_schema import Pagination
from schemas.stage_schema import (
    CreateStageSchema,
    StageSchema,
    FilterStageSchema,
    ListStageSchema,
)
from managers.stage_manager import StageManager
from models.stage_model import Stage


stage_router = APIRouter(tags=["stages"])


@stage_router.get("/stages/{stage_id}/", response_model=StageSchema)
async def get_stage(
    stage_id: int, session: AsyncSession = Depends(get_session)
) -> StageSchema:
    return await StageManager.retrieve(id=stage_id, session=session)


@stage_router.get("/stages/", response_model=ListStageSchema)
async def get_stages_list(
    page: int = Query(1, ge=1),
    limit: int = Query(10, le=100),
    id: Optional[int] = Query(None),
    name: Optional[str] = Query(None),
    pipeline_id: Optional[int] = Query(None),
    session: AsyncSession = Depends(get_session),
) -> ListStageSchema:
    filters = FilterStageSchema(
        id=id,
        name=name,
        pipeline_id=pipeline_id,
    )
    filter_params = filters.model_dump(exclude_none=True, exclude_unset=True)
    result = await StageManager.paginate_list(
        where=tuple(getattr(Stage, key) == value for key, value in filter_params.items()),
        page=page,
        limit=limit,
        session=session,
    )
    return ListStageSchema(
        pagination=Pagination(
            limit=result.get("limit"),
            page=result.get("page"),
            total=result.get("total"),
        ),
        stages=result.get("items"),
    )


@stage_router.post(
    "/stages/",
    response_model=StageSchema,
    status_code=status.HTTP_201_CREATED,
)
async def create_stage(
    stage: CreateStageSchema, session: AsyncSession = Depends(get_session)
) -> StageSchema:
    async with transaction(session):
        response = await StageManager.create(input_data=stage, session=session)
    return response


@stage_router.patch("/stages/{stage_id}/", response_model=StageSchema)
async def update_stage(
    stage_id: int,
    stage: StageSchema,
    session: AsyncSession = Depends(get_session),
):
    async with transaction(session):
        return await StageManager.update(
            session=session,
            pk=stage_id,
            input_data=stage.model_dump(exclude_unset=True),
        )


@stage_router.delete("/stages/{stage_id}/", status_code=status.HTTP_200_OK)
async def delete_stage(
    stage_id: int,
    session: AsyncSession = Depends(get_session),
):
    async with transaction(session):
        return await StageManager.delete(id=stage_id, session=session)


