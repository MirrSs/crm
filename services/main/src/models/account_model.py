import sqlalchemy
from models.base_model import BaseModel
from passlib import hash
from sqlalchemy.orm import relationship


class Account(BaseModel):
    __tablename__ = "accounts"

    # email = sqlalchemy.Column(sqlalchemy.String(50), unique=True, index=True)
    name = sqlalchemy.Column(sqlalchemy.String(256), unique=True, index=True)

    users = relationship("User", back_populates="account", lazy="joined")

    country = sqlalchemy.Column(sqlalchemy.String(12))

    def __str__(self):
        return self.name
