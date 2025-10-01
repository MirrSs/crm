from typing import Any

from fastapi import HTTPException
from sqlalchemy import delete, and_
from sqlalchemy.ext.asyncio import AsyncSession
from db.postgres.mixins.base_mixin import BaseMixin


class DeleteMixin(BaseMixin):
    @classmethod
    async def delete(cls, session: AsyncSession, **kwargs: Any) -> dict | HTTPException:
        """Delete object by keys"""
        filtered_fields = cls.init_filtered_fields(filter_fields=kwargs)

        await session.execute(delete(cls.table).where(and_(True, *filtered_fields)))

        return {"status": "success"}
