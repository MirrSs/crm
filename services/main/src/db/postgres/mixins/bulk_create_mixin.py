from typing import Any
from pydantic import BaseModel
from fastapi import HTTPException
from sqlalchemy import insert
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from db.postgres.mixins.base_mixin import BaseMixin


class BulkCreateMixin(BaseMixin):
    @classmethod
    async def bulk_create(
        cls, input_data: List[BaseModel], session: AsyncSession
    ) -> dict:
        """Create multiple objects"""
        if not input_data:
            raise HTTPException(status_code=400, detail="No data provided for creation")

        values = [data.model_dump() for data in input_data]

        # Execute bulk insert
        await session.execute(insert(cls.table).values(values))
        
        return {"status": "success"}
