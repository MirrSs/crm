import sqlalchemy
from sqlalchemy.dialects.postgresql import JSONB

from models.base_model import BaseModel


class History(BaseModel):
    __tablename__ = "history"

    entity_type = sqlalchemy.Column(sqlalchemy.String(64), index=True, nullable=False)
    entity_id = sqlalchemy.Column(sqlalchemy.Integer, index=True, nullable=False)

    account_id = sqlalchemy.Column(sqlalchemy.Integer, nullable=True, index=True)
    user_id = sqlalchemy.Column(sqlalchemy.Integer, nullable=True, index=True)

    action = sqlalchemy.Column(sqlalchemy.String(16), index=True, nullable=False)
    changes = sqlalchemy.Column(JSONB, nullable=True)
    meta = sqlalchemy.Column(JSONB, nullable=True)

    def __str__(self):
        return f"{self.entity_type}:{self.entity_id}:{self.action}"


