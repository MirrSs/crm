from managers.crud_manager import CRUDManager
from models.product_model import Product
from schemas.product_schema import ProductSchema


class ProductManager(CRUDManager):
    table = Product
    create_scheme = ProductSchema
    update_scheme = ProductSchema


