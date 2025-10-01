from managers.crud_manager import CRUDManager
from models.lead_model import Lead
from schemas.lead_schema import LeadSchema


class LeadManager(CRUDManager):
    table = Lead
    create_scheme = LeadSchema
    update_scheme = LeadSchema


