from managers.crud_manager import CRUDManager
from models.deal_model import Deal
from schemas.deal_schema import DealSchema


class DealManager(CRUDManager):
    table = Deal
    create_scheme = DealSchema
    update_scheme = DealSchema


