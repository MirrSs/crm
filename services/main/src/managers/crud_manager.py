from db.postgres.mixins.create_mixin import CreateMixin
from db.postgres.mixins.delete_mixin import DeleteMixin
from db.postgres.mixins.list_mixin import ListMixin
from db.postgres.mixins.retrieve_mixin import RetrieveMixin
from db.postgres.mixins.update_mixin import UpdateMixin
from db.postgres.mixins.bulk_delete_mixin import BulkDeleteMixin
from db.postgres.mixins.bulk_create_mixin import BulkCreateMixin


class CRUDManager(
    ListMixin,
    RetrieveMixin,
    CreateMixin,
    UpdateMixin,
    DeleteMixin,
    BulkDeleteMixin,
    BulkCreateMixin
):
    pass
