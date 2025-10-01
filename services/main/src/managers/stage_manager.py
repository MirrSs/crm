from managers.crud_manager import CRUDManager
from models.stage_model import Stage
from schemas.stage_schema import StageSchema


class StageManager(CRUDManager):
    table = Stage
    create_scheme = StageSchema
    update_scheme = StageSchema


