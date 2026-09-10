import os
from fastapi import FastAPI
from api.base_router import base_router
from db.postgres.db import engine, Base
from contextlib import asynccontextmanager
from loguru import logger
from services.s3_service import S3Service
from fastapi.staticfiles import StaticFiles
# from settings import (
#     MONGODB_PROD_URL,
#     MONGODB_PROD_USER,
#     MONGODB_PROD_PASSWORD,
#     MONGODB_DEV_URL,
#     S3_URL,
#     S3_PRODUCTS_BUCKET_NAME,
#     S3_ACCESS_KEY,
#     S3_SECRET_KEY,
# )
from fastapi.middleware.cors import CORSMiddleware


@asynccontextmanager
async def lifespan(application: FastAPI):
    await S3Service.create_bucket()
    logger.info("🚀 Starting application")
    yield
    logger.info("⛔ Stopping application")


app = FastAPI(lifespan=lifespan)
app.include_router(base_router)
app.mount("/static", StaticFiles(directory="static"), name="static")

origins = [
    "http://localhost.tiangolo.com",
    "https://localhost.tiangolo.com",
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:4173",
    "http://192.168.1.201:5173",
    "http://185.246.64.164:4173",
    "https://ilya.p.radis.io"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/ping/")
async def healthcheck():
    return {"ping": "pong!"}
