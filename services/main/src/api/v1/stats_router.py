from fastapi import APIRouter, Depends, Query, Security
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime

from db.postgres.db import get_session
from services.auth_service import AuthService
from models.deal_model import Deal
from models.lead_model import Lead
from models.activity_model import Activity
from models.user_model import User
from schemas.stats_schema import UserStatsResponse, UserStatsItem


stats_router = APIRouter(tags=["stats"])


@stats_router.get("/stats/users/", response_model=UserStatsResponse)
async def users_stats(
    start: datetime = Query(...),
    end: datetime = Query(...),
    user = Security(AuthService.get_current_user, scopes=["accounts"]),
    session: AsyncSession = Depends(get_session),
) -> UserStatsResponse:
    # Aggregate per owner_user_id
    deals_q = select(
        Deal.owner_user_id.label("owner"),
        func.count(Deal.id),
        func.coalesce(func.sum(Deal.amount), 0),
    ).where(Deal.created_at >= start, Deal.created_at <= end).group_by(Deal.owner_user_id)

    leads_q = select(
        Lead.owner_user_id.label("owner"), func.count(Lead.id)
    ).where(Lead.created_at >= start, Lead.created_at <= end).group_by(Lead.owner_user_id)

    acts_q = select(
        Activity.owner_user_id.label("owner"), func.count(Activity.id)
    ).where(Activity.created_at >= start, Activity.created_at <= end).group_by(Activity.owner_user_id)

    deals_res = (await session.execute(deals_q)).all()
    leads_res = (await session.execute(leads_q)).all()
    acts_res = (await session.execute(acts_q)).all()

    owners = set([r[0] for r in deals_res] + [r[0] for r in leads_res] + [r[0] for r in acts_res])
    items = []
    if owners:
        users = (await session.execute(select(User).where(User.id.in_(owners)))).scalars().all()
        id_to_user = {u.id: u for u in users}
        for owner_id in owners:
            deals_count = next((int(r[1]) for r in deals_res if r[0] == owner_id), 0)
            deals_amount = float(next((r[2] for r in deals_res if r[0] == owner_id), 0) or 0)
            leads_count = next((int(r[1]) for r in leads_res if r[0] == owner_id), 0)
            acts_count = next((int(r[1]) for r in acts_res if r[0] == owner_id), 0)
            user_obj = id_to_user.get(owner_id)
            items.append(
                UserStatsItem(
                    user_id=owner_id or 0,
                    user_name=(user_obj.name if user_obj else None),
                    deals_count=deals_count,
                    deals_amount=deals_amount,
                    leads_count=leads_count,
                    activities_count=acts_count,
                )
            )

    return UserStatsResponse(start=start, end=end, items=items)


