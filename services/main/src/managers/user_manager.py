from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from passlib import hash
from db.postgres.mixins.base_mixin import TableType
from managers.crud_manager import CRUDManager
from models.user_model import User
from schemas.user_schema import UserSchema


class UserManager(CRUDManager):
    table = User
    create_scheme = UserSchema
    update_scheme = UserSchema

    @classmethod
    async def create(
            cls,
            input_data: UserSchema,
            session: AsyncSession,
    ) -> TableType:
        input_data.password = hash.bcrypt.hash(input_data.password)
        return await super().create(input_data, session)

    @classmethod
    async def update(
            cls, session: AsyncSession,
            pk: int,
            input_data: UserSchema | dict
    ) -> TableType | HTTPException:
        if input_data.get('password'):  # todo make it better
            input_data.password = hash.bcrypt.hash(input_data.password)
        return await super().update(session, pk, input_data)
