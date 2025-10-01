from managers.crud_manager import CRUDManager
from models.company_model import Company
from schemas.company_schema import CompanySchema


class CompanyManager(CRUDManager):
    table = Company
    create_scheme = CompanySchema
    update_scheme = CompanySchema


