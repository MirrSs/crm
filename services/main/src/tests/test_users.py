from fastapi.testclient import TestClient
from main import app
import pytest
from schemas.user_schema import CreateUserSchema, UserSchema
from schemas.account_schema import CreateAccountSchema


@pytest.mark.asyncio
async def test_users(client):
    # Get empty list
    response = await client.get("/api/v1/users/")
    assert response.status_code == 200
    assert response.json() == []
    # Mock account
    account_data = CreateAccountSchema(
        name="testuser", rcrm_url="test.retailcrm.ru", rcrm_api_key="test_api_key"
    )
    account = await client.post(
        "/api/v1/accounts/", content=account_data.model_dump_json()
    )
    assert account.status_code == 201
    # Create User
    user_data = CreateUserSchema(
        name="testuser",
        email="testmail@mail.com",
        password="testpassword",
        account_id=account.json()["id"],
        role="Owner",
    )
    user = await client.post(
        "/api/v1/users/",
        content=user_data.model_dump_json(),
    )
    assert isinstance(user.json()["id"], int)
    assert user.status_code == 201
    assert user.json()["id"] is not None
    # Attempt to create existing User
    response = await client.post("/api/v1/users/", content=user_data.model_dump_json())
    assert response.status_code == 400
    # Update User
    # user_data = UserSchema(
    #     name="change name"
    # )
    # response = await client.patch(f"/api/v1/users/{user.json()['id']}/", content=user_data.model_dump_json())
    # assert response.status_code == 200
    # Delete User
    # response = await client.delete(f"/api/v1/users/{user.json()['id']}/")
    # assert response.status_code == 200