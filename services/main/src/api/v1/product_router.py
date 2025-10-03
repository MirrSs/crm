from fastapi import APIRouter, Depends, status, Query
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from db.postgres.db import get_session
from fastapi import Security
from fastapi import HTTPException
from services.auth_service import AuthService
from db.transaction import transaction
from schemas.pagination_schema import Pagination
from schemas.product_schema import (
    CreateProductSchema,
    ProductSchema,
    FilterProductSchema,
    ListProductSchema,
)
from managers.product_manager import ProductManager
from models.product_model import Product


product_router = APIRouter(tags=["products"])


@product_router.get("/products/{product_id}/", response_model=ProductSchema)
async def get_product(
    product_id: int,
    user = Security(AuthService.get_current_user, scopes=["products"]),
    session: AsyncSession = Depends(get_session)
) -> ProductSchema:
    obj = await ProductManager.retrieve(id=product_id, session=session)
    if getattr(obj, "account_id", None) != user.account_id:
        raise HTTPException(status_code=404, detail="Object not found")
    return obj


@product_router.get("/products/", response_model=ListProductSchema)
async def get_products_list(
    page: int = Query(1, ge=1),
    limit: int = Query(10, le=100),
    id: Optional[int] = Query(None),
    sku: Optional[str] = Query(None),
    name: Optional[str] = Query(None),
    account_id: Optional[int] = Query(None),
    user = Security(AuthService.get_current_user, scopes=["products"]),
    session: AsyncSession = Depends(get_session),
) -> ListProductSchema:
    filters = FilterProductSchema(
        id=id,
        sku=sku,
        name=name,
        account_id=account_id,
    )
    filter_params = filters.model_dump(exclude_none=True, exclude_unset=True)
    filter_params["account_id"] = user.account_id
    result = await ProductManager.paginate_list(
        where=tuple(getattr(Product, key) == value for key, value in filter_params.items()),
        page=page,
        limit=limit,
        session=session,
    )
    return ListProductSchema(
        pagination=Pagination(
            limit=result.get("limit"),
            page=result.get("page"),
            total=result.get("total"),
        ),
        products=result.get("items"),
    )


@product_router.post(
    "/products/",
    response_model=ProductSchema,
    status_code=status.HTTP_201_CREATED,
)
async def create_product(
    product: CreateProductSchema,
    user = Security(AuthService.get_current_user, scopes=["products"]),
    session: AsyncSession = Depends(get_session)
) -> ProductSchema:
    async with transaction(session):
        data = product.model_dump(exclude_unset=True)
        data["account_id"] = user.account_id
        response = await ProductManager.create(input_data=data, session=session, user_id=user.id, account_id=user.account_id)
    return response


@product_router.patch("/products/{product_id}/", response_model=ProductSchema)
async def update_product(
    product_id: int,
    product: ProductSchema,
    user = Security(AuthService.get_current_user, scopes=["products"]),
    session: AsyncSession = Depends(get_session),
):
    async with transaction(session):
        obj = await ProductManager.retrieve(id=product_id, session=session)
        if getattr(obj, "account_id", None) != user.account_id:
            raise HTTPException(status_code=404, detail="Object not found")
        return await ProductManager.update(
            session=session,
            pk=product_id,
            input_data=product.model_dump(exclude_unset=True),
            user_id=user.id,
            account_id=user.account_id,
        )


@product_router.delete("/products/{product_id}/", status_code=status.HTTP_200_OK)
async def delete_product(
    product_id: int,
    user = Security(AuthService.get_current_user, scopes=["products"]),
    session: AsyncSession = Depends(get_session),
):
    async with transaction(session):
        obj = await ProductManager.retrieve(id=product_id, session=session)
        if getattr(obj, "account_id", None) != user.account_id:
            raise HTTPException(status_code=404, detail="Object not found")
        return await ProductManager.delete(id=product_id, session=session, user_id=user.id, account_id=user.account_id)


