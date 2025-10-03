from fastapi import APIRouter, Depends, Query
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from db.postgres.db import get_session
from managers.history_manager import HistoryManager
from schemas.history_schema import ListHistorySchema


history_router = APIRouter(tags=["history"])


@history_router.get("/history/", response_model=ListHistorySchema)
async def list_history(
    entity_type: str = Query(...),
    entity_id: int = Query(...),
    page: int = Query(1, ge=1),
    limit: int = Query(20, le=100),
    session: AsyncSession = Depends(get_session),
):
    result = await HistoryManager.list_for_entity(
        session=session,
        entity_type=entity_type,
        entity_id=entity_id,
        page=page,
        limit=limit,
    )
    return ListHistorySchema(items=result["items"], total=result["total"], page=page, limit=limit)


