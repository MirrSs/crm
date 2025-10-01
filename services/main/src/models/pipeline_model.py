import sqlalchemy
from sqlalchemy.orm import relationship

from models.base_model import BaseModel


class Pipeline(BaseModel):
    __tablename__ = "pipelines"

    name = sqlalchemy.Column(sqlalchemy.String(128), index=True)
    description = sqlalchemy.Column(sqlalchemy.String(512), nullable=True)

    account_id = sqlalchemy.Column(
        sqlalchemy.Integer, sqlalchemy.ForeignKey("accounts.id"), nullable=False
    )

    owner_user_id = sqlalchemy.Column(
        sqlalchemy.Integer, sqlalchemy.ForeignKey("users.id"), nullable=True
    )

    stages = relationship("Stage", back_populates="pipeline", lazy="joined")

    def __str__(self):
        return self.name


