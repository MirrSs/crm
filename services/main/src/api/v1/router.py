from fastapi import APIRouter

from api.v1.user_router import user_router
from api.v1.auth_router import auth_router
from api.v1.account_router import account_router
from api.v1.company_router import company_router
from api.v1.contact_router import contact_router
from api.v1.pipeline_router import pipeline_router
from api.v1.stage_router import stage_router
from api.v1.deal_router import deal_router
from api.v1.lead_router import lead_router
from api.v1.activity_router import activity_router
from api.v1.product_router import product_router
from api.v1.service_router import service_router
from api.v1.deal_items_router import deal_items_router
from api.v1.custom_field_router import custom_field_router
from api.v1.stats_router import stats_router
from api.v1.history_router import history_router


api_v1 = APIRouter(prefix="/v1")

# Add your routers here
api_v1.include_router(auth_router)
api_v1.include_router(account_router)
api_v1.include_router(user_router)
api_v1.include_router(company_router)
api_v1.include_router(contact_router)
api_v1.include_router(pipeline_router)
api_v1.include_router(stage_router)
api_v1.include_router(deal_router)
api_v1.include_router(lead_router)
api_v1.include_router(activity_router)
api_v1.include_router(product_router)
api_v1.include_router(service_router)
api_v1.include_router(deal_items_router)
api_v1.include_router(custom_field_router)
api_v1.include_router(stats_router)
api_v1.include_router(history_router)

