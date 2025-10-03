from typing import Any

from fastapi import HTTPException
from sqlalchemy import delete, and_
from sqlalchemy.ext.asyncio import AsyncSession
from db.postgres.mixins.base_mixin import BaseMixin
from services.history_service import HistoryService


class DeleteMixin(BaseMixin):
    @classmethod
    async def delete(cls, session: AsyncSession, *, user_id: int | None = None, account_id: int | None = None, **kwargs: Any) -> dict | HTTPException:
        """Delete object by keys"""
        filtered_fields = cls.init_filtered_fields(filter_fields=kwargs)
        # try to fetch ids for history
        from sqlalchemy import select
        res = await session.execute(select(cls.table.id, getattr(cls.table, "account_id", None)).where(and_(True, *filtered_fields)))
        rows = res.all()
        await session.execute(delete(cls.table).where(and_(True, *filtered_fields)))
        # history: delete per row
        try:
            for row in rows:
                obj_id = row[0]
                acc_id = None
                if len(row) > 1:
                    acc_id = row[1]
                await HistoryService.log(
                    session,
                    entity_type=cls.table.__tablename__,
                    entity_id=obj_id,
                    action="delete",
                    account_id=account_id or acc_id,
                    user_id=user_id,
                    changes=None,
                    meta=None,
                )
        except Exception:
            pass
        return {"status": "success"}
