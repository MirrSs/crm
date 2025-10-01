from pydantic import BaseModel
from fastapi.security import OAuth2PasswordBearer

auth_schema = OAuth2PasswordBearer(
    tokenUrl="/api/v1/tokens",
    scopes={
        "users-get-me": "read information about current user",
        "users-patch-me": "update information about user.",
    },
)


class TokensSchema(BaseModel):
    access_token: str
    refresh_token: str
