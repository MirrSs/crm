from managers.crud_manager import CRUDManager
from models.custom_field_models import (
    CustomFieldDefinition,
    CustomDictionary,
    CustomDictionaryValue,
    CustomFieldValue,
)
from schemas.custom_field_schema import (
    CustomFieldDefinitionSchema,
    CustomDictionarySchema,
    CustomDictionaryValueSchema,
    CustomFieldValueSchema,
)


class CustomFieldDefinitionManager(CRUDManager):
    table = CustomFieldDefinition
    create_scheme = CustomFieldDefinitionSchema
    update_scheme = CustomFieldDefinitionSchema


class CustomDictionaryManager(CRUDManager):
    table = CustomDictionary
    create_scheme = CustomDictionarySchema
    update_scheme = CustomDictionarySchema


class CustomDictionaryValueManager(CRUDManager):
    table = CustomDictionaryValue
    create_scheme = CustomDictionaryValueSchema
    update_scheme = CustomDictionaryValueSchema


class CustomFieldValueManager(CRUDManager):
    table = CustomFieldValue
    create_scheme = CustomFieldValueSchema
    update_scheme = CustomFieldValueSchema

    @classmethod
    async def create(cls, input_data: CustomFieldValueSchema | dict, session):
        data = input_data if isinstance(input_data, dict) else input_data.__dict__
        # Validate against definition
        definition = await CustomFieldDefinitionManager.retrieve(
            session=session,
            object_type=data.get("object_type"),
            code=data.get("field_code"),
            account_id=data.get("account_id"),
        )

        field_type = (getattr(definition, "field_type", "") or "").lower()
        # Enforce required
        if definition.is_required:
            if all(
                data.get(k) in (None, "")
                for k in (
                    "int_value",
                    "float_value",
                    "datetime_value",
                    "string_value",
                    "bool_value",
                    "dict_values",
                )
            ):
                from fastapi import HTTPException
                raise HTTPException(status_code=400, detail="Field value is required")

        # Type validation (basic)
        if field_type == "int" and data.get("int_value") is None:
            raise HTTPException(status_code=400, detail="int_value required for int type")
        if field_type == "float" and data.get("float_value") is None:
            raise HTTPException(status_code=400, detail="float_value required for float type")
        if field_type == "datetime" and data.get("datetime_value") is None:
            raise HTTPException(status_code=400, detail="datetime_value required for datetime type")
        if field_type == "string" and (data.get("string_value") is None or data.get("string_value") == ""):
            raise HTTPException(status_code=400, detail="string_value required for string type")
        if field_type == "bool" and data.get("bool_value") is None:
            raise HTTPException(status_code=400, detail="bool_value required for bool type")
        if field_type in ("enum", "multienum"):
            dict_values = (data.get("dict_values") or "").split(",") if data.get("dict_values") else []
            if not dict_values:
                raise HTTPException(status_code=400, detail="dict_values required for enum types")
            # Validate that dict values exist in referenced dictionary if present
            if definition.dictionary_id:
                allowed = (
                    await CustomDictionaryValueManager.list(
                        session=session,
                        where=(CustomDictionaryValue.dictionary_id == definition.dictionary_id,),
                    )
                )
                allowed_ids = {str(v.id) for v in allowed}
                invalid = [v for v in dict_values if v not in allowed_ids]
                if invalid:
                    raise HTTPException(status_code=400, detail=f"Invalid dictionary values: {','.join(invalid)}")

        return await super().create(input_data=data, session=session)


