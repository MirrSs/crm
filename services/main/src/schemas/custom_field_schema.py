from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from schemas.pagination_schema import Pagination


class CreateCustomFieldDefinitionSchema(BaseModel):
    object_type: str = Field(max_length=64)
    name: str = Field(max_length=128)
    code: str = Field(max_length=64)
    field_type: str = Field(max_length=24)
    is_required: bool = False
    account_id: int

    class Config:
        from_attributes = True


class CustomFieldDefinitionSchema(BaseModel):
    id: int | None = None
    object_type: Optional[str] = None
    name: Optional[str] = None
    code: Optional[str] = None
    field_type: Optional[str] = None
    is_required: Optional[bool] = None
    account_id: Optional[int] = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


class FilterCustomFieldDefinitionSchema(BaseModel):
    id: int | None = None
    object_type: Optional[str] = None
    code: Optional[str] = None
    account_id: Optional[int] = None


class ListCustomFieldDefinitionSchema(BaseModel):
    pagination: Pagination
    fields: List[CustomFieldDefinitionSchema]


class CreateCustomDictionarySchema(BaseModel):
    code: str = Field(max_length=64)
    name: str = Field(max_length=128)
    account_id: int

    class Config:
        from_attributes = True


class CustomDictionarySchema(BaseModel):
    id: int | None = None
    code: Optional[str] = None
    name: Optional[str] = None
    account_id: Optional[int] = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


class FilterCustomDictionarySchema(BaseModel):
    id: int | None = None
    code: Optional[str] = None
    account_id: Optional[int] = None


class ListCustomDictionarySchema(BaseModel):
    pagination: Pagination
    dictionaries: List[CustomDictionarySchema]


class CreateCustomDictionaryValueSchema(BaseModel):
    dictionary_id: int
    value: str = Field(max_length=128)

    class Config:
        from_attributes = True


class CustomDictionaryValueSchema(BaseModel):
    id: int | None = None
    dictionary_id: Optional[int] = None
    value: Optional[str] = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


class FilterCustomDictionaryValueSchema(BaseModel):
    id: int | None = None
    dictionary_id: Optional[int] = None


class ListCustomDictionaryValueSchema(BaseModel):
    pagination: Pagination
    values: List[CustomDictionaryValueSchema]


class CreateCustomFieldValueSchema(BaseModel):
    object_type: str = Field(max_length=64)
    object_id: int
    field_code: str = Field(max_length=64)
    int_value: Optional[int] = None
    float_value: Optional[float] = None
    datetime_value: Optional[datetime] = None
    string_value: Optional[str] = Field(default=None, max_length=1024)
    bool_value: Optional[bool] = None
    dict_values: Optional[str] = Field(default=None, max_length=256)

    class Config:
        from_attributes = True


class CustomFieldValueSchema(BaseModel):
    id: int | None = None
    object_type: Optional[str] = None
    object_id: Optional[int] = None
    field_code: Optional[str] = None
    int_value: Optional[int] = None
    float_value: Optional[float] = None
    datetime_value: Optional[datetime] = None
    string_value: Optional[str] = None
    bool_value: Optional[bool] = None
    dict_values: Optional[str] = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


class FilterCustomFieldValueSchema(BaseModel):
    id: int | None = None
    object_type: Optional[str] = None
    object_id: Optional[int] = None
    field_code: Optional[str] = None


class ListCustomFieldValueSchema(BaseModel):
    pagination: Pagination
    values: List[CustomFieldValueSchema]


