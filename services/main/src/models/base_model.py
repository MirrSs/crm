import sqlalchemy
from db.postgres import db
import uuid
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql.functions import now, current_timestamp

class BaseModel(db.Base):
    """
    Base model for all models with id, created_at, updated_at fields
    """
    __abstract__ = True

    id = sqlalchemy.Column(sqlalchemy.Integer, index=True, primary_key=True)

    created_at = sqlalchemy.Column(sqlalchemy.DateTime, server_default=now())
    updated_at = sqlalchemy.Column(sqlalchemy.DateTime, server_default=now(), onupdate=current_timestamp())