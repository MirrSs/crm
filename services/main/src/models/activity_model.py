import sqlalchemy
from sqlalchemy.orm import relationship

from models.base_model import BaseModel


class Activity(BaseModel):
    __tablename__ = "activities"

    type = sqlalchemy.Column(sqlalchemy.String(32), nullable=False)  # task/call/meeting/email/note
    subject = sqlalchemy.Column(sqlalchemy.String(256), nullable=True)
    description = sqlalchemy.Column(sqlalchemy.String(2048), nullable=True)
    due_at = sqlalchemy.Column(sqlalchemy.DateTime, nullable=True)
    completed = sqlalchemy.Column(sqlalchemy.Boolean, nullable=False, default=False)

    account_id = sqlalchemy.Column(
        sqlalchemy.Integer, sqlalchemy.ForeignKey("accounts.id"), nullable=False
    )

    owner_user_id = sqlalchemy.Column(
        sqlalchemy.Integer, sqlalchemy.ForeignKey("users.id"), nullable=True
    )

    # Optional links to entities (polymorphic-like via nullable FKs)
    company_id = sqlalchemy.Column(
        sqlalchemy.Integer, sqlalchemy.ForeignKey("companies.id"), nullable=True
    )
    contact_id = sqlalchemy.Column(
        sqlalchemy.Integer, sqlalchemy.ForeignKey("contacts.id"), nullable=True
    )
    deal_id = sqlalchemy.Column(
        sqlalchemy.Integer, sqlalchemy.ForeignKey("deals.id"), nullable=True
    )

    company = relationship("Company", lazy="joined")
    contact = relationship("Contact", lazy="joined")
    deal = relationship("Deal", lazy="joined")


