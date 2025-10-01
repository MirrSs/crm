from fastapi import APIRouter, Depends, status, Query
from typing import Optional
from db.postgres.db import get_session
from typing import Annotated
from schemas.account_schema import (
    CreateAccountSchema,
    AccountSchema,
    FilterAccountSchema,
    ListAccountSchema,
)
from db.transaction import transaction
from schemas.pagination_schema import Pagination
from sqlalchemy.ext.asyncio import AsyncSession
from managers.account_manager import AccountManager
from exceptions.exception import BadRequestError, ObjectNotFoundError
from models.account_model import Account
from typing import List

account_router = APIRouter(tags=["accounts"])


@account_router.get("/accounts/{account_id}/", response_model=AccountSchema)
async def get_account(
    account_id: int, session: AsyncSession = Depends(get_session)
) -> AccountSchema:
    return await AccountManager.retrieve(id=account_id, session=session)


@account_router.get("/accounts/", response_model=ListAccountSchema)
async def get_accounts_list(
    page: int = Query(1, ge=1),
    limit: int = Query(10, le=100),
    id: Optional[int] = Query(None),
    name: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    session: AsyncSession = Depends(get_session),
) -> ListAccountSchema:

    filters = FilterAccountSchema(
        id=id, name=name, country=country
    )
    filter_params = filters.model_dump(exclude_none=True, exclude_unset=True)
    result = await AccountManager.paginate_list(
        where=tuple(
            getattr(Account, key) == value for key, value in filter_params.items()
        ),
        page=page,
        limit=limit,
        session=session,
    )
    return ListAccountSchema(
        pagination=Pagination(
            limit=result.get("limit"),
            page=result.get("page"),
            total=result.get("total"),
        ),
        accounts=result.get("items"),
    )


@account_router.post(
    "/accounts/",
    response_model=AccountSchema,
    status_code=status.HTTP_201_CREATED,
)
async def create_account(
    account: CreateAccountSchema, session: AsyncSession = Depends(get_session)
) -> AccountSchema:
    try:
        user_db = await AccountManager.retrieve(name=account.name, session=session)

        if user_db:
            raise BadRequestError(detail="Account with such name exists")

    except ObjectNotFoundError:
        async with transaction(session):
            response = await AccountManager.create(input_data=account, session=session)
        return response


@account_router.patch("/accounts/{account_id}/", response_model=AccountSchema)
async def update_account(
    account_id: int,
    account: AccountSchema,
    # user=Depends(AuthService.get_current_user),
    session: AsyncSession = Depends(get_session),
):
    async with transaction(session):
        return await AccountManager.update(
            session=session,
            pk=account_id,
            input_data=account.model_dump(exclude_unset=True),
        )
