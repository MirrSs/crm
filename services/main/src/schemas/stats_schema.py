from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class UserStatsItem(BaseModel):
    user_id: int
    user_name: Optional[str] = None
    deals_count: int = 0
    deals_amount: float = 0.0
    leads_count: int = 0
    activities_count: int = 0


class UserStatsResponse(BaseModel):
    start: datetime
    end: datetime
    items: List[UserStatsItem]


