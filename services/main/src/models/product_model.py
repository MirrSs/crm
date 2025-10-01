import sqlalchemy

from models.base_model import BaseModel


class Product(BaseModel):
    __tablename__ = "products"

    sku = sqlalchemy.Column(sqlalchemy.String(64), unique=True, index=True)
    name = sqlalchemy.Column(sqlalchemy.String(256), index=True)
    description = sqlalchemy.Column(sqlalchemy.String(1024), nullable=True)
    price = sqlalchemy.Column(sqlalchemy.Numeric(12, 2), nullable=True)
    currency = sqlalchemy.Column(sqlalchemy.String(8), nullable=True)

    account_id = sqlalchemy.Column(
        sqlalchemy.Integer, sqlalchemy.ForeignKey("accounts.id"), nullable=False
    )

    def __str__(self):
        return self.name


