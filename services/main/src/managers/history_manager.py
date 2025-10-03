from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any

from managers.crud_manager import CRUDManager
from models.history_model import History


class HistoryManager(CRUDManager):
    table = History

    @classmethod
    async def list_for_entity(
        cls,
        session: AsyncSession,
        *,
        entity_type: str,
        entity_id: int,
        page: int = 1,
        limit: int = 20,
    ) -> Dict[str, Any]:
        stmt = (
            select(History)
            .where(and_(History.entity_type == entity_type, History.entity_id == entity_id))
            .order_by(History.created_at.desc())
            .limit(limit)
            .offset((page - 1) * limit)
        )
        rows = await session.execute(stmt)
        items = rows.scalars().all()
        total = await session.scalar(
            select(func.count()).select_from(
                select(History.id)
                .where(and_(History.entity_type == entity_type, History.entity_id == entity_id))
                .subquery()
            )
        )
        return {"items": items, "total": int(total or 0), "page": page, "limit": limit}


