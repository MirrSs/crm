from datetime import timedelta, datetime, timezone

import jwt
from fastapi import HTTPException, Depends, status
from db.postgres.db import get_session
from pydantic import BaseModel, ValidationError
from typing import Annotated
from fastapi.security import OAuth2PasswordRequestForm, SecurityScopes
from jwt import (
    InvalidTokenError as JWTInvalidTokenError,
    DecodeError,
    ExpiredSignatureError,
)
from sqlalchemy.ext.asyncio import AsyncSession

import settings
from db.postgres.db import get_session
from exceptions.exception import InvalidTokenError, AuthenticateError, PermissionError
from managers.user_manager import UserManager
from models.user_model import User
from schemas.auth_schema import TokensSchema, auth_schema


class AuthService:
    @staticmethod
    async def create_token(user_id: int, token_type: str, scopes: list) -> str:
        """Generate a new token for a user."""
        token_were_issued_by = "radis"  # iss
        token_were_issued_at = datetime.now(tz=timezone.utc)  # iat
        token_will_be_valid_at = datetime.now(tz=timezone.utc)  # nbf(not before)

        match token_type:
            case "access":
                token_expires_at = datetime.now(tz=timezone.utc) + timedelta(
                    seconds=settings.JWT_ACCESS_TOKEN_EXPIRATION_TIME
                )  # exp
            case "refresh":
                token_expires_at = datetime.now(tz=timezone.utc) + timedelta(
                    seconds=settings.JWT_REFRESH_TOKEN_EXPIRATION_TIME
                )  # exp

        default_header = {"typ": "JWT", "alg": "HS256"}
        payload = {
            "sub": user_id,
            "exp": token_expires_at,  # noqa
            "iat": token_were_issued_at,
            "nbf": token_will_be_valid_at,
            "iss": token_were_issued_by,
            "scopes": scopes,
        }

        return jwt.encode(
            headers=default_header, payload=payload, key=settings.JWT_SECRET_KEY
        )

    @staticmethod
    def decode_token(token: str) -> int:
        """Decode a token and return user_id took from payload."""
        try:
            payload = jwt.decode(
                jwt=token, key=settings.JWT_SECRET_KEY, algorithms=["HS256"]
            )
            user_id = payload.get("sub")
        except (JWTInvalidTokenError, DecodeError, ExpiredSignatureError, KeyError):
            raise InvalidTokenError

        return user_id

    @classmethod
    async def authenticate_user(
        cls, user_data: dict, session: AsyncSession
    ) -> User | HTTPException:
        """Check whether there is a user in the database and a password is valid."""
        password = user_data.pop("password")
        user = await UserManager.retrieve(email=user_data.get("email"), session=session)
        if user and user.verify_password(password=password):
            return user

        raise AuthenticateError()

    @classmethod
    async def assign_scopes(cls, user: User) -> list | HTTPException:
        """Assign JWT scopes based on user role."""
        role = (user.role or "").lower()

        all_scopes = [
            "accounts",
            "users",
            "companies",
            "contacts",
            "pipelines",
            "stages",
            "deals",
            "leads",
            "activities",
            "products",
            "services",
            "deal-items",
            "users-get-me",
            "users-patch-me",
        ]

        if role in ("owner", "admin"):
            return all_scopes
        if role == "manager":
            return all_scopes
        if role == "worker":
            return [
                "users-get-me",
                "users-patch-me",
                "products",
                "leads",
                "deals",
                "activities",
                "deal-items",
                "services",
            ]

        raise AuthenticateError()

    @classmethod
    async def generate_access_and_refresh_tokens(cls, user_id: int, scopes) -> tuple:
        """Create new access and refresh tokens by user_id.A refresh token should also be saved in redis
        by the following pattern: key is user_id and value is the refresh_token."""
        access_token = await cls.create_token(
            user_id=user_id, token_type="access", scopes=scopes
        )
        refresh_token = await cls.create_token(
            user_id=user_id, token_type="refresh", scopes=scopes
        )

        return access_token, refresh_token

    @classmethod
    async def get_access_and_refresh_tokens_by_email_and_password(
        cls, session: AsyncSession, user_form: OAuth2PasswordRequestForm
    ) -> tuple | HTTPException:
        user_data = {
            "email": user_form.username,
            "password": user_form.password,
        }
        user = await cls.authenticate_user(user_data=user_data, session=session)

        user_scopes = await cls.assign_scopes(user=user)

        access_token, refresh_token = await cls.generate_access_and_refresh_tokens(
            user_id=user.id, scopes=user_scopes
        )

        return access_token, refresh_token

    @classmethod
    async def get_new_access_and_refresh_tokens_using_old_refresh_token(
        cls, old_refresh_token: str
    ) -> tuple:
        """Generate new access and refresh tokens by a refresh_token if the refresh_token is valid."""
        user_id = cls.decode_token(token=old_refresh_token)
        async for session in get_session():
            user = await UserManager.retrieve(id=user_id, session=session)
        user_scopes = await cls.assign_scopes(user=user)
        access_token, refresh_token = await cls.generate_access_and_refresh_tokens(
            user_id=user_id, scopes=user_scopes
        )

        return access_token, refresh_token

    @classmethod
    async def get_current_user(
        cls,
        security_scopes: SecurityScopes,
        token: Annotated[str, Depends(auth_schema)],
    ):
        if security_scopes.scopes:
            authenticate_value = f'Bearer scope="{security_scopes.scope_str}"'
        else:
            authenticate_value = "Bearer"
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": authenticate_value},
        )
        try:
            payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=["HS256"])
            user_id: str = payload.get("sub")
            if user_id is None:
                raise credentials_exception
            token_scopes = payload.get("scopes", [])
        except (InvalidTokenError, ValidationError, DecodeError, ExpiredSignatureError) as error:
            credentials_exception.detail = f"Could not validate credentials: {error}"
            raise credentials_exception
        async for session in get_session():
            user = await UserManager.retrieve(id=user_id, session=session)
        if user is None:
            raise credentials_exception
        for scope in security_scopes.scopes:
            if scope not in payload.get("scopes"):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Not enough permissions",
                    headers={"WWW-Authenticate": authenticate_value},
                )
        return user

    # @classmethod
    # async def get_current_user(
    #     cls,
    #     session: AsyncSession = Depends(get_session),
    #     access_token: str = Depends(auth_schema),
    # ):
    #     user_id = cls.decode_token(token=access_token)

    #     user = await UserManager.retrieve(id=user_id, session=session)
    #     return user

    # @classmethod
    # async def get_current_admin(
    #     cls,
    #     session: AsyncSession = Depends(get_session),
    #     access_token: str = Depends(auth_schema),
    # ):
    #     user_id = cls.decode_token(token=access_token)

    #     user = await UserManager.get_by_id(session=session, user_id=user_id)
    #     if user.is_admin:
    #         return user
    #     raise PermissionError(detail="You dont have permissions to perform this action")
