import sqlalchemy
from sqlalchemy.orm import relationship

from models.base_model import BaseModel


class Contact(BaseModel):
    __tablename__ = "contacts"

    first_name = sqlalchemy.Column(sqlalchemy.String(80), nullable=True)
    last_name = sqlalchemy.Column(sqlalchemy.String(80), nullable=True)
    email = sqlalchemy.Column(sqlalchemy.String(120), nullable=True, index=True)
    phone = sqlalchemy.Column(sqlalchemy.String(24), nullable=True, index=True)
    position = sqlalchemy.Column(sqlalchemy.String(120), nullable=True)

    company_id = sqlalchemy.Column(
        sqlalchemy.Integer, sqlalchemy.ForeignKey("companies.id"), nullable=True
    )
    company = relationship("Company", back_populates="contacts", lazy="joined")

    account_id = sqlalchemy.Column(
        sqlalchemy.Integer, sqlalchemy.ForeignKey("accounts.id"), nullable=False
    )

    owner_user_id = sqlalchemy.Column(
        sqlalchemy.Integer, sqlalchemy.ForeignKey("users.id"), nullable=True
    )

    def __str__(self):
        return f"{self.first_name} {self.last_name}".strip()


