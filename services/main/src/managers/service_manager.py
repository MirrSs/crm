from managers.crud_manager import CRUDManager
from models.service_model import Service
from schemas.service_schema import ServiceSchema


class ServiceManager(CRUDManager):
    table = Service
    create_scheme = ServiceSchema
    update_scheme = ServiceSchema


