import sqlalchemy
from sqlalchemy.orm import relationship

from models.base_model import BaseModel


class CustomFieldDefinition(BaseModel):
    __tablename__ = "custom_field_definitions"

    object_type = sqlalchemy.Column(sqlalchemy.String(64), nullable=False, index=True)
    name = sqlalchemy.Column(sqlalchemy.String(128), nullable=False)
    code = sqlalchemy.Column(sqlalchemy.String(64), nullable=False, index=True)
    field_type = sqlalchemy.Column(sqlalchemy.String(24), nullable=False)  # int, float, datetime, string, bool, enum, multienum
    is_required = sqlalchemy.Column(sqlalchemy.Boolean, nullable=False, default=False)
    dictionary_id = sqlalchemy.Column(
        sqlalchemy.Integer, sqlalchemy.ForeignKey("custom_dictionaries.id"), nullable=True
    )

    account_id = sqlalchemy.Column(
        sqlalchemy.Integer, sqlalchemy.ForeignKey("accounts.id"), nullable=False
    )


class CustomDictionary(BaseModel):
    __tablename__ = "custom_dictionaries"

    code = sqlalchemy.Column(sqlalchemy.String(64), unique=True, index=True)
    name = sqlalchemy.Column(sqlalchemy.String(128), nullable=False)
    account_id = sqlalchemy.Column(
        sqlalchemy.Integer, sqlalchemy.ForeignKey("accounts.id"), nullable=False
    )


class CustomDictionaryValue(BaseModel):
    __tablename__ = "custom_dictionary_values"

    dictionary_id = sqlalchemy.Column(
        sqlalchemy.Integer, sqlalchemy.ForeignKey("custom_dictionaries.id"), nullable=False
    )
    value = sqlalchemy.Column(sqlalchemy.String(128), nullable=False)


class CustomFieldValue(BaseModel):
    __tablename__ = "custom_field_values"

    object_type = sqlalchemy.Column(sqlalchemy.String(64), nullable=False, index=True)
    object_id = sqlalchemy.Column(sqlalchemy.Integer, nullable=False, index=True)
    field_code = sqlalchemy.Column(sqlalchemy.String(64), nullable=False)
    account_id = sqlalchemy.Column(
        sqlalchemy.Integer, sqlalchemy.ForeignKey("accounts.id"), nullable=False
    )

    int_value = sqlalchemy.Column(sqlalchemy.Integer, nullable=True)
    float_value = sqlalchemy.Column(sqlalchemy.Float, nullable=True)
    datetime_value = sqlalchemy.Column(sqlalchemy.DateTime, nullable=True)
    string_value = sqlalchemy.Column(sqlalchemy.String(1024), nullable=True)
    bool_value = sqlalchemy.Column(sqlalchemy.Boolean, nullable=True)

    # For enum/multienum store selected dictionary value ids as CSV string for simplicity
    dict_values = sqlalchemy.Column(sqlalchemy.String(256), nullable=True)


