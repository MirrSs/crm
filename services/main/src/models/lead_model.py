import sqlalchemy

from models.base_model import BaseModel


class Lead(BaseModel):
    __tablename__ = "leads"

    first_name = sqlalchemy.Column(sqlalchemy.String(80), nullable=True)
    last_name = sqlalchemy.Column(sqlalchemy.String(80), nullable=True)
    email = sqlalchemy.Column(sqlalchemy.String(120), nullable=True, index=True)
    phone = sqlalchemy.Column(sqlalchemy.String(24), nullable=True, index=True)
    company_name = sqlalchemy.Column(sqlalchemy.String(256), nullable=True)
    source = sqlalchemy.Column(sqlalchemy.String(64), nullable=True)
    status = sqlalchemy.Column(sqlalchemy.String(64), nullable=True)
    notes = sqlalchemy.Column(sqlalchemy.String(1024), nullable=True)

    account_id = sqlalchemy.Column(
        sqlalchemy.Integer, sqlalchemy.ForeignKey("accounts.id"), nullable=False
    )

    owner_user_id = sqlalchemy.Column(
        sqlalchemy.Integer, sqlalchemy.ForeignKey("users.id"), nullable=True
    )

    def __str__(self):
        return f"{self.first_name} {self.last_name}".strip()


