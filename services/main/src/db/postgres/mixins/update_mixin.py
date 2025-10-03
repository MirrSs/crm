from fastapi import HTTPException
from sqlalchemy import update, select
from sqlalchemy.ext.asyncio import AsyncSession
from db.postgres.mixins.base_mixin import BaseMixin, TableType, UpdateBaseSchema
from services.history_service import HistoryService, build_changes_diff, model_to_plain_dict


class UpdateMixin(BaseMixin):
    @classmethod
    async def update(
        cls, session: AsyncSession, pk: int, input_data: UpdateBaseSchema | dict, *, user_id: int | None = None, account_id: int | None = None
    ) -> TableType | HTTPException:
        """Update object by primary keys"""
        # fetch before
        before_obj = await session.get(cls.table, pk)
        before = model_to_plain_dict(before_obj) if before_obj else None
        await session.execute(
            update(cls.table)
            .where(cls.table.id == pk)
            .values(
                **(
                    input_data
                    if isinstance(input_data, dict)
                    else input_data.__dict__
                )
            )
        )

        result = await session.execute(
            select(cls.table).options(*cls.preloaded_fields).where(cls.table.id == pk)
        )

        obj = result.scalars().first()
        # history: update
        try:
            after = model_to_plain_dict(obj) if obj else None
            changes = build_changes_diff(before, after)
            if changes:
                await HistoryService.log(
                    session,
                    entity_type=cls.table.__tablename__,
                    entity_id=pk,
                    action="update",
                    account_id=account_id or getattr(obj, "account_id", None),
                    user_id=user_id,
                    changes=changes,
                    meta=None,
                )
        except Exception:
            pass
        return obj

    @classmethod
    async def update_m2m(
        cls, session: AsyncSession, input_data: UpdateBaseSchema | dict
    ) -> TableType | HTTPException:
        """Update m2m object"""
        filter_fields = cls.init_m2m_filtered_fields(
            filter_fields=(
                input_data if isinstance(input_data, dict) else input_data.__dict__
            )
        )
        await session.execute(
            update(cls.table)
            .values(
                **(
                    input_data
                    if isinstance(input_data, dict)
                    else input_data.__dict__
                )
            )
            .where(*filter_fields)
        )

        result = await session.execute(select(cls.table).where(*filter_fields))

        return result.scalars().first()
