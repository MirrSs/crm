import sqlalchemy
from sqlalchemy.orm import relationship

from models.base_model import BaseModel


class Company(BaseModel):
    __tablename__ = "companies"

    name = sqlalchemy.Column(sqlalchemy.String(256), index=True)
    website = sqlalchemy.Column(sqlalchemy.String(256), nullable=True)
    email = sqlalchemy.Column(sqlalchemy.String(120), nullable=True, index=True)
    phone = sqlalchemy.Column(sqlalchemy.String(24), nullable=True, index=True)

    country = sqlalchemy.Column(sqlalchemy.String(64), nullable=True)
    city = sqlalchemy.Column(sqlalchemy.String(64), nullable=True)
    address = sqlalchemy.Column(sqlalchemy.String(256), nullable=True)

    account_id = sqlalchemy.Column(
        sqlalchemy.Integer, sqlalchemy.ForeignKey("accounts.id"), nullable=False
    )

    owner_user_id = sqlalchemy.Column(
        sqlalchemy.Integer, sqlalchemy.ForeignKey("users.id"), nullable=True
    )

    contacts = relationship("Contact", back_populates="company", lazy="joined")

    def __str__(self):
        return self.name


