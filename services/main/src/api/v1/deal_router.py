from fastapi import APIRouter, Depends, status, Query
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from db.postgres.db import get_session
from fastapi import Security
from services.auth_service import AuthService
from db.transaction import transaction
from schemas.pagination_schema import Pagination
from schemas.deal_schema import (
    CreateDealSchema,
    DealSchema,
    FilterDealSchema,
    ListDealSchema,
)
from managers.deal_manager import DealManager
from models.deal_model import Deal
from datetime import date


deal_router = APIRouter(tags=["deals"])


@deal_router.get("/deals/{deal_id}/", response_model=DealSchema)
async def get_deal(
    deal_id: int,
    user = Security(AuthService.get_current_user, scopes=["deals"]),
    session: AsyncSession = Depends(get_session)
) -> DealSchema:
    obj = await DealManager.retrieve(id=deal_id, session=session)
    if getattr(obj, "account_id", None) != user.account_id:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Object not found")
    return obj


@deal_router.get("/deals/", response_model=ListDealSchema)
async def get_deals_list(
    page: int = Query(1, ge=1),
    limit: int = Query(10, le=100),
    id: Optional[int] = Query(None),
    name: Optional[str] = Query(None),
    account_id: Optional[int] = Query(None),
    company_id: Optional[int] = Query(None),
    contact_id: Optional[int] = Query(None),
    pipeline_id: Optional[int] = Query(None),
    stage_id: Optional[int] = Query(None),
    owner_user_id: Optional[int] = Query(None),
    user = Security(AuthService.get_current_user, scopes=["deals"]),
    session: AsyncSession = Depends(get_session),
) -> ListDealSchema:
    filters = FilterDealSchema(
        id=id,
        name=name,
        account_id=account_id,
        company_id=company_id,
        contact_id=contact_id,
        pipeline_id=pipeline_id,
        stage_id=stage_id,
        owner_user_id=owner_user_id,
    )
    filter_params = filters.model_dump(exclude_none=True, exclude_unset=True)
    # worker sees only own objects
    if (user.role or "").lower() == "worker":
        filter_params["owner_user_id"] = user.id
    filter_params["account_id"] = user.account_id
    result = await DealManager.paginate_list(
        where=tuple(getattr(Deal, key) == value for key, value in filter_params.items()),
        page=page,
        limit=limit,
        session=session,
    )
    return ListDealSchema(
        pagination=Pagination(
            limit=result.get("limit"),
            page=result.get("page"),
            total=result.get("total"),
        ),
        deals=result.get("items"),
    )


@deal_router.post(
    "/deals/",
    response_model=DealSchema,
    status_code=status.HTTP_201_CREATED,
)
async def create_deal(
    deal: CreateDealSchema,
    user = Security(AuthService.get_current_user, scopes=["deals"]),
    session: AsyncSession = Depends(get_session)
) -> DealSchema:
    async with transaction(session):
        data = deal.model_dump(exclude_unset=True)
        data["account_id"] = user.account_id
        response = await DealManager.create(input_data=data, session=session)
    return response


@deal_router.patch("/deals/{deal_id}/", response_model=DealSchema)
async def update_deal(
    deal_id: int,
    deal: DealSchema,
    user = Security(AuthService.get_current_user, scopes=["deals"]),
    session: AsyncSession = Depends(get_session),
):
    async with transaction(session):
        obj = await DealManager.retrieve(id=deal_id, session=session)
        if getattr(obj, "account_id", None) != user.account_id:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Object not found")
        return await DealManager.update(
            session=session,
            pk=deal_id,
            input_data=deal.model_dump(exclude_unset=True),
        )


@deal_router.delete("/deals/{deal_id}/", status_code=status.HTTP_200_OK)
async def delete_deal(
    deal_id: int,
    user = Security(AuthService.get_current_user, scopes=["deals"]),
    session: AsyncSession = Depends(get_session),
):
    async with transaction(session):
        obj = await DealManager.retrieve(id=deal_id, session=session)
        if getattr(obj, "account_id", None) != user.account_id:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Object not found")
        return await DealManager.delete(id=deal_id, session=session)


@deal_router.patch("/deals/{deal_id}/move/", response_model=DealSchema)
async def move_deal(
    deal_id: int,
    stage_id: int = Query(..., ge=1),
    order_index: int = Query(0, ge=0),
    user = Security(AuthService.get_current_user, scopes=["deals"]),
    session: AsyncSession = Depends(get_session),
) -> DealSchema:
    async with transaction(session):
        obj = await DealManager.retrieve(id=deal_id, session=session)
        if getattr(obj, "account_id", None) != user.account_id:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Object not found")
        return await DealManager.update(
            session=session,
            pk=deal_id,
            input_data={"stage_id": stage_id, "order_index": order_index},
        )


@deal_router.get("/deals/upcoming/", response_model=ListDealSchema)
async def get_upcoming_deal_closures(
    start: date = Query(...),
    end: date = Query(...),
    user = Security(AuthService.get_current_user, scopes=["deals"]),
    page: int = Query(1, ge=1),
    limit: int = Query(100, le=500),
    session: AsyncSession = Depends(get_session),
) -> ListDealSchema:
    where = [Deal.account_id == user.account_id, Deal.expected_close_date >= start, Deal.expected_close_date <= end]
    if (user.role or "").lower() == "worker":
        where.append(Deal.owner_user_id == user.id)
    result = await DealManager.paginate_list(
        where=tuple(where), page=page, limit=limit, session=session
    )
    return ListDealSchema(
        pagination=Pagination(limit=result.get("limit"), page=result.get("page"), total=result.get("total")),
        deals=result.get("items"),
    )

