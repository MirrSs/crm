from fastapi import APIRouter, Depends, status, Query, Security, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from db.postgres.db import get_session
from db.transaction import transaction
from services.auth_service import AuthService
from schemas.pagination_schema import Pagination
from schemas.deal_item_schema import (
    CreateDealProductSchema,
    DealProductSchema,
    ListDealProductSchema,
    CreateDealServiceSchema,
    DealServiceSchema,
    ListDealServiceSchema,
)
from managers.deal_item_manager import DealProductManager, DealServiceManager
from models.deal_item_models import DealProduct, DealService
from managers.deal_manager import DealManager


deal_items_router = APIRouter(tags=["deal-items"])


def _ensure_deal_access(deal, user):
    if getattr(deal, "account_id", None) != user.account_id:
        raise HTTPException(status_code=404, detail="Object not found")


@deal_items_router.get("/deals/{deal_id}/products/", response_model=ListDealProductSchema)
async def get_deal_products(
    deal_id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(10, le=100),
    user = Security(AuthService.get_current_user, scopes=["deal-items"]),
    session: AsyncSession = Depends(get_session),
) -> ListDealProductSchema:
    deal = await DealManager.retrieve(id=deal_id, session=session)
    _ensure_deal_access(deal, user)
    result = await DealProductManager.paginate_list(
        where=(DealProduct.deal_id == deal_id,), page=page, limit=limit, session=session
    )
    return ListDealProductSchema(
        pagination=Pagination(limit=result.get("limit"), page=result.get("page"), total=result.get("total")),
        items=result.get("items"),
    )


@deal_items_router.post(
    "/deals/{deal_id}/products/",
    response_model=DealProductSchema,
    status_code=status.HTTP_201_CREATED,
)
async def add_product_to_deal(
    deal_id: int,
    item: CreateDealProductSchema,
    user = Security(AuthService.get_current_user, scopes=["deal-items"]),
    session: AsyncSession = Depends(get_session),
) -> DealProductSchema:
    async with transaction(session):
        deal = await DealManager.retrieve(id=deal_id, session=session)
        _ensure_deal_access(deal, user)
        data = item.model_dump(exclude_unset=True)
        data["deal_id"] = deal_id
        return await DealProductManager.create(input_data=data, session=session)


@deal_items_router.delete("/deals/{deal_id}/products/{item_id}/", status_code=status.HTTP_200_OK)
async def remove_product_from_deal(
    deal_id: int,
    item_id: int,
    user = Security(AuthService.get_current_user, scopes=["deal-items"]),
    session: AsyncSession = Depends(get_session),
):
    async with transaction(session):
        deal = await DealManager.retrieve(id=deal_id, session=session)
        _ensure_deal_access(deal, user)
        return await DealProductManager.delete(id=item_id, session=session)


@deal_items_router.patch("/deals/{deal_id}/products/{item_id}/", response_model=DealProductSchema)
async def update_deal_product(
    deal_id: int,
    item_id: int,
    body: DealProductSchema,
    user = Security(AuthService.get_current_user, scopes=["deal-items"]),
    session: AsyncSession = Depends(get_session),
) -> DealProductSchema:
    async with transaction(session):
        deal = await DealManager.retrieve(id=deal_id, session=session)
        _ensure_deal_access(deal, user)
        return await DealProductManager.update(session=session, pk=item_id, input_data=body.model_dump(exclude_unset=True))


@deal_items_router.get("/deals/{deal_id}/services/", response_model=ListDealServiceSchema)
async def get_deal_services(
    deal_id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(10, le=100),
    user = Security(AuthService.get_current_user, scopes=["deal-items"]),
    session: AsyncSession = Depends(get_session),
) -> ListDealServiceSchema:
    deal = await DealManager.retrieve(id=deal_id, session=session)
    _ensure_deal_access(deal, user)
    result = await DealServiceManager.paginate_list(
        where=(DealService.deal_id == deal_id,), page=page, limit=limit, session=session
    )
    return ListDealServiceSchema(
        pagination=Pagination(limit=result.get("limit"), page=result.get("page"), total=result.get("total")),
        items=result.get("items"),
    )


@deal_items_router.post(
    "/deals/{deal_id}/services/",
    response_model=DealServiceSchema,
    status_code=status.HTTP_201_CREATED,
)
async def add_service_to_deal(
    deal_id: int,
    item: CreateDealServiceSchema,
    user = Security(AuthService.get_current_user, scopes=["deal-items"]),
    session: AsyncSession = Depends(get_session),
) -> DealServiceSchema:
    async with transaction(session):
        deal = await DealManager.retrieve(id=deal_id, session=session)
        _ensure_deal_access(deal, user)
        data = item.model_dump(exclude_unset=True)
        data["deal_id"] = deal_id
        return await DealServiceManager.create(input_data=data, session=session)


@deal_items_router.delete("/deals/{deal_id}/services/{item_id}/", status_code=status.HTTP_200_OK)
async def remove_service_from_deal(
    deal_id: int,
    item_id: int,
    user = Security(AuthService.get_current_user, scopes=["deal-items"]),
    session: AsyncSession = Depends(get_session),
):
    async with transaction(session):
        deal = await DealManager.retrieve(id=deal_id, session=session)
        _ensure_deal_access(deal, user)
        return await DealServiceManager.delete(id=item_id, session=session)


@deal_items_router.patch("/deals/{deal_id}/services/{item_id}/", response_model=DealServiceSchema)
async def update_deal_service(
    deal_id: int,
    item_id: int,
    body: DealServiceSchema,
    user = Security(AuthService.get_current_user, scopes=["deal-items"]),
    session: AsyncSession = Depends(get_session),
) -> DealServiceSchema:
    async with transaction(session):
        deal = await DealManager.retrieve(id=deal_id, session=session)
        _ensure_deal_access(deal, user)
        return await DealServiceManager.update(session=session, pk=item_id, input_data=body.model_dump(exclude_unset=True))


