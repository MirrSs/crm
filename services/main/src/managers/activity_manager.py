from managers.crud_manager import CRUDManager
from models.activity_model import Activity
from schemas.activity_schema import ActivitySchema


class ActivityManager(CRUDManager):
    table = Activity
    create_scheme = ActivitySchema
    update_scheme = ActivitySchema


