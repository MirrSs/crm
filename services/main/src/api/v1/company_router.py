from fastapi import APIRouter, Depends, status, Query
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from db.postgres.db import get_session
from db.transaction import transaction
from schemas.pagination_schema import Pagination
from schemas.company_schema import (
    CreateCompanySchema,
    CompanySchema,
    FilterCompanySchema,
    ListCompanySchema,
)
from managers.company_manager import CompanyManager
from models.company_model import Company


company_router = APIRouter(tags=["companies"])


@company_router.get("/companies/{company_id}/", response_model=CompanySchema)
async def get_company(
    company_id: int, session: AsyncSession = Depends(get_session)
) -> CompanySchema:
    return await CompanyManager.retrieve(id=company_id, session=session)


@company_router.get("/companies/", response_model=ListCompanySchema)
async def get_companies_list(
    page: int = Query(1, ge=1),
    limit: int = Query(10, le=100),
    id: Optional[int] = Query(None),
    name: Optional[str] = Query(None),
    email: Optional[str] = Query(None),
    phone: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    account_id: Optional[int] = Query(None),
    owner_user_id: Optional[int] = Query(None),
    session: AsyncSession = Depends(get_session),
) -> ListCompanySchema:
    filters = FilterCompanySchema(
        id=id,
        name=name,
        email=email,
        phone=phone,
        country=country,
        city=city,
        account_id=account_id,
        owner_user_id=owner_user_id,
    )
    filter_params = filters.model_dump(exclude_none=True, exclude_unset=True)
    result = await CompanyManager.paginate_list(
        where=tuple(getattr(Company, key) == value for key, value in filter_params.items()),
        page=page,
        limit=limit,
        session=session,
    )
    return ListCompanySchema(
        pagination=Pagination(
            limit=result.get("limit"),
            page=result.get("page"),
            total=result.get("total"),
        ),
        companies=result.get("items"),
    )


@company_router.post(
    "/companies/",
    response_model=CompanySchema,
    status_code=status.HTTP_201_CREATED,
)
async def create_company(
    company: CreateCompanySchema, session: AsyncSession = Depends(get_session)
) -> CompanySchema:
    async with transaction(session):
        response = await CompanyManager.create(input_data=company, session=session)
    return response


@company_router.patch("/companies/{company_id}/", response_model=CompanySchema)
async def update_company(
    company_id: int,
    company: CompanySchema,
    session: AsyncSession = Depends(get_session),
):
    async with transaction(session):
        return await CompanyManager.update(
            session=session,
            pk=company_id,
            input_data=company.model_dump(exclude_unset=True),
        )


@company_router.delete("/companies/{company_id}/", status_code=status.HTTP_200_OK)
async def delete_company(
    company_id: int,
    session: AsyncSession = Depends(get_session),
):
    async with transaction(session):
        return await CompanyManager.delete(id=company_id, session=session)


