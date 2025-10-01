from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import func
from typing import Dict, Any, List, Union, Tuple

from db.postgres.mixins.base_mixin import BaseMixin


class ListMixin(BaseMixin):
    @classmethod
    async def list(
        cls,
        session: AsyncSession,
        filter_by: dict = {},  # noqa
        where: tuple | list = (),
        order_by: tuple | list = (),
        custom_preloaded_fields: tuple | list = (),
        offset: int = 0,
        limit: int = 100,
    ) -> list:
        """Get list of objects"""

        preloaded_fields = cls.init_preloaded_fields(
            preloaded_fields=custom_preloaded_fields
        )

        objects = await session.execute(
            select(cls.table)
            .filter_by(**filter_by)
            .where(*where)
            .options(*cls.preloaded_fields)
            .options(*preloaded_fields)
            .order_by(*order_by)
            .limit(limit)
            .offset(offset)
        )
        return objects.unique().scalars().all()

    @classmethod
    async def paginate_list(
        cls,
        session: AsyncSession,
        filter_by: Dict[str, Any] = {},
        where: Union[tuple, list] = (),
        order_by: Union[tuple, list] = (),
        custom_preloaded_fields: Union[tuple, list] = (),
        page: int = 1,
        limit: int = 10,
    ) -> Dict[str, Any]:
        """Get a paginated list of objects"""
        preloaded_fields = cls.init_preloaded_fields(
            preloaded_fields=custom_preloaded_fields
        )

        offset = (page - 1) * limit

        # Modify the query to handle list of IDs if provided
        query = select(cls.table).filter_by(**filter_by).where(*where)
        
        # Only if 'id' is provided in filter_by as a list
        if 'id' in filter_by and isinstance(filter_by['id'], list):
            query = query.where(cls.table.id.in_(filter_by['id']))
        
        count_query = select(func.count()).select_from(query.alias())

        total_count = (await session.execute(count_query)).scalar()

        objects = await session.execute(
            query.options(*cls.preloaded_fields)
            .options(*preloaded_fields)
            .order_by(*order_by)
            .limit(limit)
            .offset(offset)
        )

        items = objects.unique().scalars().all()

        return {"total": total_count, "items": items, "page": page, "limit": limit}