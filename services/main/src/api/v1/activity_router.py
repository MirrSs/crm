from fastapi import APIRouter, Depends, status, Query
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from db.postgres.db import get_session
from fastapi import Security
from services.auth_service import AuthService
from db.transaction import transaction
from schemas.pagination_schema import Pagination
from schemas.activity_schema import (
    CreateActivitySchema,
    ActivitySchema,
    FilterActivitySchema,
    ListActivitySchema,
)
from managers.activity_manager import ActivityManager
from models.activity_model import Activity
from datetime import datetime, timedelta


activity_router = APIRouter(tags=["activities"])


@activity_router.get("/activities/{activity_id}/", response_model=ActivitySchema)
async def get_activity(
    activity_id: int,
    user = Security(AuthService.get_current_user, scopes=["activities"]),
    session: AsyncSession = Depends(get_session)
) -> ActivitySchema:
    obj = await ActivityManager.retrieve(id=activity_id, session=session)
    if getattr(obj, "account_id", None) != user.account_id:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Object not found")
    return obj


@activity_router.get("/activities/", response_model=ListActivitySchema)
async def get_activities_list(
    page: int = Query(1, ge=1),
    limit: int = Query(10, le=100),
    id: Optional[int] = Query(None),
    type: Optional[str] = Query(None),
    completed: Optional[bool] = Query(None),
    account_id: Optional[int] = Query(None),
    owner_user_id: Optional[int] = Query(None),
    company_id: Optional[int] = Query(None),
    contact_id: Optional[int] = Query(None),
    deal_id: Optional[int] = Query(None),
    user = Security(AuthService.get_current_user, scopes=["activities"]),
    session: AsyncSession = Depends(get_session),
) -> ListActivitySchema:
    filters = FilterActivitySchema(
        id=id,
        type=type,
        completed=completed,
        account_id=account_id,
        owner_user_id=owner_user_id,
        company_id=company_id,
        contact_id=contact_id,
        deal_id=deal_id,
    )
    filter_params = filters.model_dump(exclude_none=True, exclude_unset=True)
    filter_params["account_id"] = user.account_id
    if (user.role or "").lower() == "worker":
        filter_params["owner_user_id"] = user.id
    result = await ActivityManager.paginate_list(
        where=tuple(getattr(Activity, key) == value for key, value in filter_params.items()),
        page=page,
        limit=limit,
        session=session,
    )
    return ListActivitySchema(
        pagination=Pagination(
            limit=result.get("limit"),
            page=result.get("page"),
            total=result.get("total"),
        ),
        activities=result.get("items"),
    )


@activity_router.get("/activities/calendar/", response_model=ListActivitySchema)
async def get_calendar_activities(
    start: datetime = Query(...),
    end: datetime = Query(...),
    completed: Optional[bool] = Query(None),
    user = Security(AuthService.get_current_user, scopes=["activities"]),
    page: int = Query(1, ge=1),
    limit: int = Query(100, le=500),
    session: AsyncSession = Depends(get_session),
) -> ListActivitySchema:
    where = [Activity.account_id == user.account_id, Activity.due_at >= start, Activity.due_at <= end]
    if completed is not None:
        where.append(Activity.completed == completed)
    if (user.role or "").lower() == "worker":
        where.append(Activity.owner_user_id == user.id)
    result = await ActivityManager.paginate_list(
        where=tuple(where), page=page, limit=limit, session=session
    )
    return ListActivitySchema(
        pagination=Pagination(limit=result.get("limit"), page=result.get("page"), total=result.get("total")),
        activities=result.get("items"),
    )


@activity_router.post(
    "/activities/",
    response_model=ActivitySchema,
    status_code=status.HTTP_201_CREATED,
)
async def create_activity(
    activity: CreateActivitySchema,
    user = Security(AuthService.get_current_user, scopes=["activities"]),
    session: AsyncSession = Depends(get_session)
) -> ActivitySchema:
    async with transaction(session):
        data = activity.model_dump(exclude_unset=True)
        data["account_id"] = user.account_id
        response = await ActivityManager.create(input_data=data, session=session)
    return response


@activity_router.patch("/activities/{activity_id}/", response_model=ActivitySchema)
async def update_activity(
    activity_id: int,
    activity: ActivitySchema,
    user = Security(AuthService.get_current_user, scopes=["activities"]),
    session: AsyncSession = Depends(get_session),
):
    async with transaction(session):
        obj = await ActivityManager.retrieve(id=activity_id, session=session)
        if getattr(obj, "account_id", None) != user.account_id:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Object not found")
        return await ActivityManager.update(
            session=session,
            pk=activity_id,
            input_data=activity.model_dump(exclude_unset=True),
        )


@activity_router.delete("/activities/{activity_id}/", status_code=status.HTTP_200_OK)
async def delete_activity(
    activity_id: int,
    user = Security(AuthService.get_current_user, scopes=["activities"]),
    session: AsyncSession = Depends(get_session),
):
    async with transaction(session):
        obj = await ActivityManager.retrieve(id=activity_id, session=session)
        if getattr(obj, "account_id", None) != user.account_id:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Object not found")
        return await ActivityManager.delete(id=activity_id, session=session)


