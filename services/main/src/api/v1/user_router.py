from fastapi import APIRouter, Depends, status, Query, Security
from db.postgres.db import get_session
from typing import Optional, Annotated
from schemas.pagination_schema import Pagination
from schemas.user_schema import (
    CreateUserSchema,
    UserSchema,
    UserMineSchema,
    FilterUserSchema,
    ListUserSchema,
)
from db.transaction import transaction
from sqlalchemy.ext.asyncio import AsyncSession
from managers.user_manager import UserManager
from services.auth_service import AuthService
from exceptions.exception import BadRequestError, ObjectNotFoundError
from models.user_model import User


user_router = APIRouter(tags=["users"])


@user_router.get("/users/mine/", response_model=UserMineSchema)
async def get_current_user(
    user: Annotated[
        User, Security(AuthService.get_current_user, scopes=["users-get-me"])
    ],
    session: AsyncSession = Depends(get_session),
) -> UserMineSchema:
    return user


@user_router.get("/users/{user_id}/", response_model=UserSchema)
async def get_user(
    user_id: int, session: AsyncSession = Depends(get_session)
) -> UserSchema:
    return await UserManager.retrieve(id=user_id, session=session)


@user_router.get("/users/", response_model=ListUserSchema)
async def get_users_list(
    page: int = Query(1, ge=1),
    limit: int = Query(10, le=100),
    id: Optional[int] = Query(None),
    name: Optional[str] = Query(None),
    email: Optional[str] = Query(None),
    account_id: Optional[int] = Query(None),
    role: Optional[str] = Query(None),
    session: AsyncSession = Depends(get_session),
) -> ListUserSchema:
    filters = FilterUserSchema(
        id=id, name=name, email=email, account_id=account_id, role=role
    )
    filter_params = filters.model_dump(exclude_none=True, exclude_unset=True)
    result = await UserManager.paginate_list(
        where=tuple(
            getattr(User, key) == value for key, value in filter_params.items()
        ),
        page=page,
        limit=limit,
        session=session,
    )
    return ListUserSchema(
        pagination=Pagination(
            limit=result.get("limit"),
            page=result.get("page"),
            total=result.get("total"),
        ),
        users=result.get("items"),
    )


@user_router.post(
    "/users/",
    response_model=UserSchema,
    status_code=status.HTTP_201_CREATED,
)
async def create_user(
    user: CreateUserSchema, session: AsyncSession = Depends(get_session)
) -> UserSchema:
    try:
        user_db = await UserManager.retrieve(email=user.email, session=session)

        if user_db:
            raise BadRequestError(detail="User with such email exists")

    except ObjectNotFoundError:
        async with transaction(session):
            response = await UserManager.create(input_data=user, session=session)
        return response


@user_router.patch("/users/mine/", response_model=UserSchema)
async def update_info_about_current_user(
    user_info: UserSchema,
    user: Annotated[
        User,
        Security(
            AuthService.get_current_user, scopes=["users-get-me", "users-patch-me"]
        ),
    ],
    session: AsyncSession = Depends(get_session),
):
    async with transaction(session):
        return await UserManager.update(
            session=session,
            pk=user.id,
            input_data=user_info.model_dump(exclude_unset=True),
        )


@user_router.delete("/users/mine/", status_code=status.HTTP_200_OK)
async def delete_user(
    user: Annotated[
        User,
        Security(
            AuthService.get_current_user, scopes=["users-get-me", "users-delete-me"]
        ),
    ],
    session: AsyncSession = Depends(get_session),
):
    async with transaction(session):
        return await UserManager.delete(id=user.id, session=session)
