import sqlalchemy
from sqlalchemy.ext.asyncio import AsyncSession
from db.postgres.db import get_session
from fastapi import Depends
from models.custom_field_value_model import CustomFieldValue


class CustomFieldMixin:
    _custom_fields = None

    @property
    async def custom_fields(self, session: AsyncSession = Depends(get_session)):
        if self._custom_fields is None:
            if session is None:
                raise ValueError("Session is not attached to the object.")
            result = await session.execute(
                sqlalchemy.select(CustomFieldValue)
                .where(CustomFieldValue.object_id == self.id)
                .where(CustomFieldValue.object_type == type(self).__name__)
            )
            self._custom_fields = result.scalars().all()
        return self._custom_fields
