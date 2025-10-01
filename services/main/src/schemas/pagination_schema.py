from pydantic import BaseModel


class Pagination(BaseModel):
    page: int = 0
    limit: int = 100
    total: int = 0
