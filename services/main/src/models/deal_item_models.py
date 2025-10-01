import sqlalchemy
from sqlalchemy.orm import relationship

from models.base_model import BaseModel


class DealProduct(BaseModel):
    __tablename__ = "deal_products"

    deal_id = sqlalchemy.Column(
        sqlalchemy.Integer, sqlalchemy.ForeignKey("deals.id"), nullable=False
    )
    product_id = sqlalchemy.Column(
        sqlalchemy.Integer, sqlalchemy.ForeignKey("products.id"), nullable=False
    )

    quantity = sqlalchemy.Column(sqlalchemy.Integer, nullable=False, default=1)
    unit_price = sqlalchemy.Column(sqlalchemy.Numeric(12, 2), nullable=True)
    currency = sqlalchemy.Column(sqlalchemy.String(8), nullable=True)


class DealService(BaseModel):
    __tablename__ = "deal_services"

    deal_id = sqlalchemy.Column(
        sqlalchemy.Integer, sqlalchemy.ForeignKey("deals.id"), nullable=False
    )
    service_id = sqlalchemy.Column(
        sqlalchemy.Integer, sqlalchemy.ForeignKey("services.id"), nullable=False
    )

    quantity = sqlalchemy.Column(sqlalchemy.Integer, nullable=False, default=1)
    unit_price = sqlalchemy.Column(sqlalchemy.Numeric(12, 2), nullable=True)
    currency = sqlalchemy.Column(sqlalchemy.String(8), nullable=True)


