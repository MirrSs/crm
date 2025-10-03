from sqlalchemy.ext.asyncio import AsyncSession

from db.postgres.mixins.base_mixin import BaseMixin, TableType, CreateBaseSchema
from services.history_service import HistoryService, build_changes_diff, model_to_plain_dict


class CreateMixin(BaseMixin):
    @classmethod
    async def create(
        cls,
        input_data: CreateBaseSchema | dict,
        session: AsyncSession,
        *,
        user_id: int | None = None,
        account_id: int | None = None,
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
        # history: creation
        try:
            after = model_to_plain_dict(obj)
            await HistoryService.log(
                session,
                entity_type=cls.table.__tablename__,
                entity_id=obj.id,
                action="create",
                account_id=account_id or getattr(obj, "account_id", None),
                user_id=user_id,
                changes=build_changes_diff({}, after),
                meta=None,
            )
        except Exception:
            pass
        return obj
