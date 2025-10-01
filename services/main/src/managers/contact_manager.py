from managers.crud_manager import CRUDManager
from models.contact_model import Contact
from schemas.contact_schema import ContactSchema


class ContactManager(CRUDManager):
    table = Contact
    create_scheme = ContactSchema
    update_scheme = ContactSchema


