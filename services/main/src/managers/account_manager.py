from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from passlib import hash
from db.postgres.mixins.base_mixin import TableType
from managers.crud_manager import CRUDManager
from models.account_model import Account

from schemas.account_schema import AccountSchema, CreateAccountSchema


class AccountManager(CRUDManager):
    table = Account
    create_scheme = AccountSchema
    update_scheme = AccountSchema

    @classmethod
    async def create(
        cls,
        input_data: CreateAccountSchema,
        session: AsyncSession,
    ) -> TableType:
        response = await super().create(input_data=input_data, session=session)
        return response
