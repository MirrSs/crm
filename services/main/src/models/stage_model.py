import sqlalchemy
from sqlalchemy.orm import relationship

from models.base_model import BaseModel


class Stage(BaseModel):
    __tablename__ = "stages"

    name = sqlalchemy.Column(sqlalchemy.String(128), index=True)
    probability = sqlalchemy.Column(sqlalchemy.Integer, nullable=True)  # 0..100
    order_index = sqlalchemy.Column(sqlalchemy.Integer, nullable=False, default=0)

    pipeline_id = sqlalchemy.Column(
        sqlalchemy.Integer, sqlalchemy.ForeignKey("pipelines.id"), nullable=False
    )
    pipeline = relationship("Pipeline", back_populates="stages", lazy="joined")

    is_closed_won = sqlalchemy.Column(sqlalchemy.Boolean, nullable=False, default=False)
    is_closed_lost = sqlalchemy.Column(sqlalchemy.Boolean, nullable=False, default=False)

    def __str__(self):
        return self.name


