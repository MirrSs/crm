from fastapi import APIRouter, Depends, status, Query
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from db.postgres.db import get_session
from fastapi import Security
from services.auth_service import AuthService
from db.transaction import transaction
from schemas.pagination_schema import Pagination
from schemas.lead_schema import (
    CreateLeadSchema,
    LeadSchema,
    FilterLeadSchema,
    ListLeadSchema,
)
from managers.lead_manager import LeadManager
from models.lead_model import Lead


lead_router = APIRouter(tags=["leads"])


@lead_router.get("/leads/{lead_id}/", response_model=LeadSchema)
async def get_lead(
    lead_id: int,
    user = Security(AuthService.get_current_user, scopes=["leads"]),
    session: AsyncSession = Depends(get_session)
) -> LeadSchema:
    obj = await LeadManager.retrieve(id=lead_id, session=session)
    if getattr(obj, "account_id", None) != user.account_id:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Object not found")
    return obj


@lead_router.get("/leads/", response_model=ListLeadSchema)
async def get_leads_list(
    page: int = Query(1, ge=1),
    limit: int = Query(10, le=100),
    id: Optional[int] = Query(None),
    email: Optional[str] = Query(None),
    phone: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    account_id: Optional[int] = Query(None),
    owner_user_id: Optional[int] = Query(None),
    user = Security(AuthService.get_current_user, scopes=["leads"]),
    session: AsyncSession = Depends(get_session),
) -> ListLeadSchema:
    filters = FilterLeadSchema(
        id=id,
        email=email,
        phone=phone,
        source=source,
        status=status,
        account_id=account_id,
        owner_user_id=owner_user_id,
    )
    filter_params = filters.model_dump(exclude_none=True, exclude_unset=True)
    filter_params["account_id"] = user.account_id
    if (user.role or "").lower() == "worker":
        filter_params["owner_user_id"] = user.id
    result = await LeadManager.paginate_list(
        where=tuple(getattr(Lead, key) == value for key, value in filter_params.items()),
        page=page,
        limit=limit,
        session=session,
    )
    return ListLeadSchema(
        pagination=Pagination(
            limit=result.get("limit"),
            page=result.get("page"),
            total=result.get("total"),
        ),
        leads=result.get("items"),
    )


@lead_router.post(
    "/leads/",
    response_model=LeadSchema,
    status_code=status.HTTP_201_CREATED,
)
async def create_lead(
    lead: CreateLeadSchema,
    user = Security(AuthService.get_current_user, scopes=["leads"]),
    session: AsyncSession = Depends(get_session)
) -> LeadSchema:
    async with transaction(session):
        data = lead.model_dump(exclude_unset=True)
        data["account_id"] = user.account_id
        response = await LeadManager.create(input_data=data, session=session)
    return response


@lead_router.patch("/leads/{lead_id}/", response_model=LeadSchema)
async def update_lead(
    lead_id: int,
    lead: LeadSchema,
    user = Security(AuthService.get_current_user, scopes=["leads"]),
    session: AsyncSession = Depends(get_session),
):
    async with transaction(session):
        obj = await LeadManager.retrieve(id=lead_id, session=session)
        if getattr(obj, "account_id", None) != user.account_id:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Object not found")
        return await LeadManager.update(
            session=session,
            pk=lead_id,
            input_data=lead.model_dump(exclude_unset=True),
        )


@lead_router.delete("/leads/{lead_id}/", status_code=status.HTTP_200_OK)
async def delete_lead(
    lead_id: int,
    user = Security(AuthService.get_current_user, scopes=["leads"]),
    session: AsyncSession = Depends(get_session),
):
    async with transaction(session):
        obj = await LeadManager.retrieve(id=lead_id, session=session)
        if getattr(obj, "account_id", None) != user.account_id:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Object not found")
        return await LeadManager.delete(id=lead_id, session=session)


