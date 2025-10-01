from fastapi import status, HTTPException


class BaseError(HTTPException):
    status_code: int
    default_detail: str
    default_headers: dict | None = None

    def __init__(
        self, detail: str = None, status_code: int = 400, headers: dict = None
    ):
        self.detail = detail or self.default_detail
        self.headers = headers or self.default_headers
        self.status_code = status_code
        super().__init__(detail=detail, status_code=status_code, headers=headers)


class BadRequestError(BaseError):
    pass


class ObjectNotFoundError(BaseError):
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = "Object not found"

    def __init__(self, detail: str):
        super().__init__(
            detail=detail or self.default_detail, status_code=self.status_code
        )


class AuthenticateError(BaseError):
    status_code = status.HTTP_401_UNAUTHORIZED
    default_detail = "Invalid username or password"
    default_headers = ({"WWW-Authenticate": "Bearer"},)

    def __init__(self):
        super().__init__(detail=self.default_detail, status_code=self.status_code)


class InvalidTokenError(AuthenticateError):
    default_detail = "This token have already been used or is invalid"


class PermissionError(BaseError):
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = "You dont have permissions to perform this action"

    def __init__(self, detail: str):
        super().__init__(
            detail=detail or self.default_detail, status_code=self.status_code
        )
