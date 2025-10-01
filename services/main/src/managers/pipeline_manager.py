from managers.crud_manager import CRUDManager
from models.pipeline_model import Pipeline
from schemas.pipeline_schema import PipelineSchema


class PipelineManager(CRUDManager):
    table = Pipeline
    create_scheme = PipelineSchema
    update_scheme = PipelineSchema


