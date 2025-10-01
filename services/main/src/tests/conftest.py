import pytest
from fastapi.testclient import TestClient
from httpx import AsyncClient, ASGITransport
import sqlalchemy as sa
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from db.postgres.db import Base, get_session
from main import app

SQLALCHEMY_DATABASE_URL = "sqlite+aiosqlite:///./test.db"

async_engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}, future=True
)
TestingSessionLocal = sessionmaker(
    async_engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


@sa.event.listens_for(async_engine.sync_engine, "connect")
def do_connect(dbapi_connection, connection_record):
    dbapi_connection.isolation_level = None


@sa.event.listens_for(async_engine.sync_engine, "begin")
def do_begin(conn):
    conn.exec_driver_sql("BEGIN")


@pytest.fixture(scope="session")
async def setup_database():
    async with async_engine.begin() as conn:
        # Drop all tables, recreate them
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    await async_engine.dispose()


@pytest.fixture(scope="function")
async def session(setup_database):
    async with async_engine.connect() as connection:
        async with connection.begin():
            async with TestingSessionLocal(bind=connection) as session:
                async with connection.begin_nested():
                    @sa.event.listens_for(session.sync_session, "after_transaction_end")
                    def end_savepoint(session, transaction):
                        if not connection.in_nested_transaction():
                            connection.begin_nested()

                yield session


@pytest.fixture(scope="function")
def app_instance():
    return app


@pytest.fixture(scope="function")
async def client(session, app_instance):
    def override_get_db():
        yield session

    app.dependency_overrides[get_session] = override_get_db
    async with AsyncClient(
        transport=ASGITransport(app=app_instance), base_url="http://localhost"
    ) as ac:
        yield ac
    del app.dependency_overrides[get_session]
