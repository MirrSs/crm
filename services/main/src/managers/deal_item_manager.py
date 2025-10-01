from managers.crud_manager import CRUDManager
from models.deal_item_models import DealProduct, DealService
from schemas.deal_item_schema import DealProductSchema, DealServiceSchema


class DealProductManager(CRUDManager):
    table = DealProduct
    create_scheme = DealProductSchema
    update_scheme = DealProductSchema


class DealServiceManager(CRUDManager):
    table = DealService
    create_scheme = DealServiceSchema
    update_scheme = DealServiceSchema


