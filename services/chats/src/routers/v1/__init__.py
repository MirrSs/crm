from fastapi import APIRouter
from .channels import router as channels_router
from .conversations import router as conversations_router

api_v1 = APIRouter(prefix="/v1")
api_v1.include_router(channels_router)
api_v1.include_router(conversations_router)


