from fastapi import APIRouter, Depends, status, Query
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from db.postgres.db import get_session
from db.transaction import transaction
from schemas.pagination_schema import Pagination
from schemas.pipeline_schema import (
    CreatePipelineSchema,
    PipelineSchema,
    FilterPipelineSchema,
    ListPipelineSchema,
)
from managers.pipeline_manager import PipelineManager
from models.pipeline_model import Pipeline


pipeline_router = APIRouter(tags=["pipelines"])


@pipeline_router.get("/pipelines/{pipeline_id}/", response_model=PipelineSchema)
async def get_pipeline(
    pipeline_id: int, session: AsyncSession = Depends(get_session)
) -> PipelineSchema:
    return await PipelineManager.retrieve(id=pipeline_id, session=session)


@pipeline_router.get("/pipelines/", response_model=ListPipelineSchema)
async def get_pipelines_list(
    page: int = Query(1, ge=1),
    limit: int = Query(10, le=100),
    id: Optional[int] = Query(None),
    name: Optional[str] = Query(None),
    account_id: Optional[int] = Query(None),
    owner_user_id: Optional[int] = Query(None),
    session: AsyncSession = Depends(get_session),
) -> ListPipelineSchema:
    filters = FilterPipelineSchema(
        id=id,
        name=name,
        account_id=account_id,
        owner_user_id=owner_user_id,
    )
    filter_params = filters.model_dump(exclude_none=True, exclude_unset=True)
    result = await PipelineManager.paginate_list(
        where=tuple(getattr(Pipeline, key) == value for key, value in filter_params.items()),
        page=page,
        limit=limit,
        session=session,
    )
    return ListPipelineSchema(
        pagination=Pagination(
            limit=result.get("limit"),
            page=result.get("page"),
            total=result.get("total"),
        ),
        pipelines=result.get("items"),
    )


@pipeline_router.post(
    "/pipelines/",
    response_model=PipelineSchema,
    status_code=status.HTTP_201_CREATED,
)
async def create_pipeline(
    pipeline: CreatePipelineSchema, session: AsyncSession = Depends(get_session)
) -> PipelineSchema:
    async with transaction(session):
        response = await PipelineManager.create(input_data=pipeline, session=session)
    return response


@pipeline_router.patch("/pipelines/{pipeline_id}/", response_model=PipelineSchema)
async def update_pipeline(
    pipeline_id: int,
    pipeline: PipelineSchema,
    session: AsyncSession = Depends(get_session),
):
    async with transaction(session):
        return await PipelineManager.update(
            session=session,
            pk=pipeline_id,
            input_data=pipeline.model_dump(exclude_unset=True),
        )


@pipeline_router.delete("/pipelines/{pipeline_id}/", status_code=status.HTTP_200_OK)
async def delete_pipeline(
    pipeline_id: int,
    session: AsyncSession = Depends(get_session),
):
    async with transaction(session):
        return await PipelineManager.delete(id=pipeline_id, session=session)


