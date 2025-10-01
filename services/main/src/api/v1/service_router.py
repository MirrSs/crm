from fastapi import APIRouter, Depends, status, Query
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from db.postgres.db import get_session
from fastapi import Security
from services.auth_service import AuthService
from fastapi import HTTPException
from db.transaction import transaction
from schemas.pagination_schema import Pagination
from schemas.service_schema import (
    CreateServiceSchema,
    ServiceSchema,
    FilterServiceSchema,
    ListServiceSchema,
)
from managers.service_manager import ServiceManager
from models.service_model import Service


service_router = APIRouter(tags=["services"])


@service_router.get("/services/{service_id}/", response_model=ServiceSchema)
async def get_service(
    service_id: int,
    user = Security(AuthService.get_current_user, scopes=["services"]),
    session: AsyncSession = Depends(get_session)
) -> ServiceSchema:
    obj = await ServiceManager.retrieve(id=service_id, session=session)
    if getattr(obj, "account_id", None) != user.account_id:
        raise HTTPException(status_code=404, detail="Object not found")
    return obj


@service_router.get("/services/", response_model=ListServiceSchema)
async def get_services_list(
    page: int = Query(1, ge=1),
    limit: int = Query(10, le=100),
    id: Optional[int] = Query(None),
    code: Optional[str] = Query(None),
    name: Optional[str] = Query(None),
    account_id: Optional[int] = Query(None),
    user = Security(AuthService.get_current_user, scopes=["services"]),
    session: AsyncSession = Depends(get_session),
) -> ListServiceSchema:
    filters = FilterServiceSchema(
        id=id,
        code=code,
        name=name,
        account_id=account_id,
    )
    filter_params = filters.model_dump(exclude_none=True, exclude_unset=True)
    filter_params["account_id"] = user.account_id
    result = await ServiceManager.paginate_list(
        where=tuple(getattr(Service, key) == value for key, value in filter_params.items()),
        page=page,
        limit=limit,
        session=session,
    )
    return ListServiceSchema(
        pagination=Pagination(
            limit=result.get("limit"),
            page=result.get("page"),
            total=result.get("total"),
        ),
        services=result.get("items"),
    )


@service_router.post(
    "/services/",
    response_model=ServiceSchema,
    status_code=status.HTTP_201_CREATED,
)
async def create_service(
    service: CreateServiceSchema,
    user = Security(AuthService.get_current_user, scopes=["services"]),
    session: AsyncSession = Depends(get_session)
) -> ServiceSchema:
    async with transaction(session):
        data = service.model_dump(exclude_unset=True)
        data["account_id"] = user.account_id
        response = await ServiceManager.create(input_data=data, session=session)
    return response


@service_router.patch("/services/{service_id}/", response_model=ServiceSchema)
async def update_service(
    service_id: int,
    service: ServiceSchema,
    user = Security(AuthService.get_current_user, scopes=["services"]),
    session: AsyncSession = Depends(get_session),
):
    async with transaction(session):
        obj = await ServiceManager.retrieve(id=service_id, session=session)
        if getattr(obj, "account_id", None) != user.account_id:
            raise HTTPException(status_code=404, detail="Object not found")
        return await ServiceManager.update(
            session=session,
            pk=service_id,
            input_data=service.model_dump(exclude_unset=True),
        )


@service_router.delete("/services/{service_id}/", status_code=status.HTTP_200_OK)
async def delete_service(
    service_id: int,
    user = Security(AuthService.get_current_user, scopes=["services"]),
    session: AsyncSession = Depends(get_session),
):
    async with transaction(session):
        obj = await ServiceManager.retrieve(id=service_id, session=session)
        if getattr(obj, "account_id", None) != user.account_id:
            raise HTTPException(status_code=404, detail="Object not found")
        return await ServiceManager.delete(id=service_id, session=session)


