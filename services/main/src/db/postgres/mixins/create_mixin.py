from sqlalchemy.ext.asyncio import AsyncSession

from db.postgres.mixins.base_mixin import BaseMixin, TableType, CreateBaseSchema


class CreateMixin(BaseMixin):
    @classmethod
    async def create(
        cls,
        input_data: CreateBaseSchema | dict,
        session: AsyncSession,
    ) -> TableType:
        """Create model"""
        data = input_data if isinstance(input_data, dict) else input_data.__dict__

        # Handle nullable relationships
        if "custom_fields" in data and data["custom_fields"] is None:
            data["custom_fields"] = []

        if "items" in data and data["items"] is None:
            data["items"] = []

        obj = cls.table(**data)  # noqa
        session.add(obj)
        await session.flush()
        await session.refresh(obj)
        return obj
