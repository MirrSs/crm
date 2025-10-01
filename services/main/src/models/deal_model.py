import sqlalchemy
from sqlalchemy.orm import relationship

from models.base_model import BaseModel


class Deal(BaseModel):
    __tablename__ = "deals"

    name = sqlalchemy.Column(sqlalchemy.String(256), index=True)
    amount = sqlalchemy.Column(sqlalchemy.Numeric(12, 2), nullable=True)
    currency = sqlalchemy.Column(sqlalchemy.String(8), nullable=True)
    expected_close_date = sqlalchemy.Column(sqlalchemy.Date, nullable=True)
    order_index = sqlalchemy.Column(sqlalchemy.Integer, nullable=False, default=0)

    account_id = sqlalchemy.Column(
        sqlalchemy.Integer, sqlalchemy.ForeignKey("accounts.id"), nullable=False
    )

    company_id = sqlalchemy.Column(
        sqlalchemy.Integer, sqlalchemy.ForeignKey("companies.id"), nullable=True
    )
    contact_id = sqlalchemy.Column(
        sqlalchemy.Integer, sqlalchemy.ForeignKey("contacts.id"), nullable=True
    )

    pipeline_id = sqlalchemy.Column(
        sqlalchemy.Integer, sqlalchemy.ForeignKey("pipelines.id"), nullable=False
    )
    stage_id = sqlalchemy.Column(
        sqlalchemy.Integer, sqlalchemy.ForeignKey("stages.id"), nullable=False
    )

    owner_user_id = sqlalchemy.Column(
        sqlalchemy.Integer, sqlalchemy.ForeignKey("users.id"), nullable=True
    )

    company = relationship("Company", lazy="joined")
    contact = relationship("Contact", lazy="joined")
    pipeline = relationship("Pipeline", lazy="joined")
    stage = relationship("Stage", lazy="joined")

    def __str__(self):
        return self.name


