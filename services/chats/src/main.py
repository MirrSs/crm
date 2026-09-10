from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.v1 import api_v1

app = FastAPI(title="Chats Service")

origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:4173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_v1, prefix="/api")

@app.get("/ping/")
async def ping():
    return {"ping": "pong!"}


