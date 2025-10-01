import sqlalchemy
from models.base_model import BaseModel
from passlib import hash
from sqlalchemy.orm import relationship


class User(BaseModel):
    __tablename__ = "users"

    email = sqlalchemy.Column(sqlalchemy.String(50), unique=True, index=True)
    name = sqlalchemy.Column(sqlalchemy.String(60))
    phone = sqlalchemy.Column(sqlalchemy.String(24), unique=True, index=True)

    password = sqlalchemy.Column(sqlalchemy.String)

    account_id = sqlalchemy.Column(
        sqlalchemy.Integer, sqlalchemy.ForeignKey("accounts.id"), nullable=False
    )

    account = relationship("Account", back_populates="users", lazy="joined")

    role = sqlalchemy.Column(sqlalchemy.String(32))

    def verify_password(self, password: str):
        return hash.bcrypt.verify(password, self.password)

    def __str__(self):
        return f"{self.name}:{self.email}"
