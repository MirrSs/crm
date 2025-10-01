from fastapi import APIRouter, Depends, Cookie, status, Response
from db.postgres.db import get_session
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from schemas.auth_schema import TokensSchema
from services.auth_service import AuthService

auth_router = APIRouter(tags=["auth"])


@auth_router.post(
    "/tokens/", response_model=TokensSchema, status_code=status.HTTP_200_OK
)
async def obtain_pair_of_tokens_by_email_and_password(
    response: Response,
    user_form: OAuth2PasswordRequestForm = Depends(),
    session: AsyncSession = Depends(get_session),
) -> TokensSchema:
    (
        access_token,
        refresh_token,
    ) = await AuthService.get_access_and_refresh_tokens_by_email_and_password(
        session=session, user_form=user_form
    )
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True)
    return TokensSchema(access_token=access_token, refresh_token=refresh_token)


@auth_router.post("/refresh/", status_code=status.HTTP_200_OK)
async def obtain_pair_of_tokens_by_refresh_token(
    response: Response, refresh_token: str = Cookie(None)
):
    (
        access_token,
        refresh_token,
    ) = await AuthService.get_new_access_and_refresh_tokens_using_old_refresh_token(
        old_refresh_token=refresh_token
    )
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True)
    return TokensSchema(access_token=access_token, refresh_token=refresh_token)


@auth_router.get('/confirm/{token}')
async def confirm_registration(
        token,
        session: AsyncSession = Depends(get_session)
) -> Response:
    return None
    # return Response(
    #     await EmailService.confirm_user(token=token, session=session)
    # )