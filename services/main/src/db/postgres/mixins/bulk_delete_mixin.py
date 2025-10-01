from typing import Any

from fastapi import HTTPException
from sqlalchemy import delete
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from db.postgres.mixins.base_mixin import BaseMixin


class BulkDeleteMixin(BaseMixin):
    @classmethod
    async def bulk_delete(cls, session: AsyncSession, ids: List[int]) -> dict:
        """Delete multiple objects by their IDs"""
        if not ids:
            raise HTTPException(
                status_code=400, detail="No IDs provided for deletion"
            )
        # Execute bulk delete
        await session.execute(delete(cls.table).where(cls.table.id.in_(ids)))

        return {"status": "success"}
