from fastapi import APIRouter, Depends, status, Query, Security
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from db.postgres.db import get_session
from db.transaction import transaction
from schemas.pagination_schema import Pagination
from services.auth_service import AuthService
from schemas.custom_field_schema import (
    CreateCustomFieldDefinitionSchema,
    CustomFieldDefinitionSchema,
    FilterCustomFieldDefinitionSchema,
    ListCustomFieldDefinitionSchema,
    CreateCustomDictionarySchema,
    CustomDictionarySchema,
    FilterCustomDictionarySchema,
    ListCustomDictionarySchema,
    CreateCustomDictionaryValueSchema,
    CustomDictionaryValueSchema,
    FilterCustomDictionaryValueSchema,
    ListCustomDictionaryValueSchema,
    CreateCustomFieldValueSchema,
    CustomFieldValueSchema,
    FilterCustomFieldValueSchema,
    ListCustomFieldValueSchema,
)
from managers.custom_field_manager import (
    CustomFieldDefinitionManager,
    CustomDictionaryManager,
    CustomDictionaryValueManager,
    CustomFieldValueManager,
)
from models.custom_field_models import (
    CustomFieldDefinition,
    CustomDictionary,
    CustomDictionaryValue,
    CustomFieldValue,
)


custom_field_router = APIRouter(tags=["custom-fields"])


# Definitions
@custom_field_router.get("/custom-fields/definitions/", response_model=ListCustomFieldDefinitionSchema)
async def list_field_definitions(
    page: int = Query(1, ge=1),
    limit: int = Query(10, le=100),
    object_type: Optional[str] = Query(None),
    code: Optional[str] = Query(None),
    user = Security(AuthService.get_current_user, scopes=["accounts"]),
    session: AsyncSession = Depends(get_session),
) -> ListCustomFieldDefinitionSchema:
    filters = FilterCustomFieldDefinitionSchema(object_type=object_type, code=code, account_id=user.account_id)
    filter_params = filters.model_dump(exclude_none=True, exclude_unset=True)
    result = await CustomFieldDefinitionManager.paginate_list(
        where=tuple(getattr(CustomFieldDefinition, key) == value for key, value in filter_params.items()),
        page=page,
        limit=limit,
        session=session,
    )
    return ListCustomFieldDefinitionSchema(
        pagination=Pagination(limit=result.get("limit"), page=result.get("page"), total=result.get("total")),
        fields=result.get("items"),
    )


@custom_field_router.post("/custom-fields/definitions/", response_model=CustomFieldDefinitionSchema, status_code=status.HTTP_201_CREATED)
async def create_field_definition(
    body: CreateCustomFieldDefinitionSchema,
    user = Security(AuthService.get_current_user, scopes=["accounts"]),
    session: AsyncSession = Depends(get_session),
) -> CustomFieldDefinitionSchema:
    async with transaction(session):
        data = body.model_dump(exclude_unset=True)
        data["account_id"] = user.account_id
        return await CustomFieldDefinitionManager.create(input_data=data, session=session)


@custom_field_router.patch("/custom-fields/definitions/{definition_id}/", response_model=CustomFieldDefinitionSchema)
async def update_field_definition(
    definition_id: int,
    body: CustomFieldDefinitionSchema,
    user = Security(AuthService.get_current_user, scopes=["accounts"]),
    session: AsyncSession = Depends(get_session),
):
    async with transaction(session):
        return await CustomFieldDefinitionManager.update(session=session, pk=definition_id, input_data=body.model_dump(exclude_unset=True))


# Dictionaries
@custom_field_router.get("/custom-fields/dictionaries/", response_model=ListCustomDictionarySchema)
async def list_dictionaries(
    page: int = Query(1, ge=1),
    limit: int = Query(10, le=100),
    code: Optional[str] = Query(None),
    user = Security(AuthService.get_current_user, scopes=["accounts"]),
    session: AsyncSession = Depends(get_session),
) -> ListCustomDictionarySchema:
    filters = FilterCustomDictionarySchema(code=code, account_id=user.account_id)
    filter_params = filters.model_dump(exclude_none=True, exclude_unset=True)
    result = await CustomDictionaryManager.paginate_list(
        where=tuple(getattr(CustomDictionary, key) == value for key, value in filter_params.items()),
        page=page,
        limit=limit,
        session=session,
    )
    return ListCustomDictionarySchema(
        pagination=Pagination(limit=result.get("limit"), page=result.get("page"), total=result.get("total")),
        dictionaries=result.get("items"),
    )


@custom_field_router.post("/custom-fields/dictionaries/", response_model=CustomDictionarySchema, status_code=status.HTTP_201_CREATED)
async def create_dictionary(
    body: CreateCustomDictionarySchema,
    user = Security(AuthService.get_current_user, scopes=["accounts"]),
    session: AsyncSession = Depends(get_session),
) -> CustomDictionarySchema:
    async with transaction(session):
        data = body.model_dump(exclude_unset=True)
        data["account_id"] = user.account_id
        return await CustomDictionaryManager.create(input_data=data, session=session)


@custom_field_router.patch("/custom-fields/dictionaries/{dictionary_id}/", response_model=CustomDictionarySchema)
async def update_dictionary(
    dictionary_id: int,
    body: CustomDictionarySchema,
    user = Security(AuthService.get_current_user, scopes=["accounts"]),
    session: AsyncSession = Depends(get_session),
):
    async with transaction(session):
        return await CustomDictionaryManager.update(session=session, pk=dictionary_id, input_data=body.model_dump(exclude_unset=True))


@custom_field_router.get("/custom-fields/dictionaries/{dictionary_id}/values/", response_model=ListCustomDictionaryValueSchema)
async def list_dictionary_values(
    dictionary_id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(10, le=100),
    user = Security(AuthService.get_current_user, scopes=["accounts"]),
    session: AsyncSession = Depends(get_session),
) -> ListCustomDictionaryValueSchema:
    result = await CustomDictionaryValueManager.paginate_list(
        where=(CustomDictionaryValue.dictionary_id == dictionary_id,),
        page=page,
        limit=limit,
        session=session,
    )
    return ListCustomDictionaryValueSchema(
        pagination=Pagination(limit=result.get("limit"), page=result.get("page"), total=result.get("total")),
        values=result.get("items"),
    )


@custom_field_router.post("/custom-fields/dictionaries/{dictionary_id}/values/", response_model=CustomDictionaryValueSchema, status_code=status.HTTP_201_CREATED)
async def create_dictionary_value(
    dictionary_id: int,
    body: CreateCustomDictionaryValueSchema,
    user = Security(AuthService.get_current_user, scopes=["accounts"]),
    session: AsyncSession = Depends(get_session),
) -> CustomDictionaryValueSchema:
    async with transaction(session):
        data = body.model_dump(exclude_unset=True)
        data["dictionary_id"] = dictionary_id
        return await CustomDictionaryValueManager.create(input_data=data, session=session)


# Values
@custom_field_router.get("/custom-fields/values/", response_model=ListCustomFieldValueSchema)
async def list_field_values(
    page: int = Query(1, ge=1),
    limit: int = Query(10, le=100),
    object_type: Optional[str] = Query(None),
    object_id: Optional[int] = Query(None),
    field_code: Optional[str] = Query(None),
    user = Security(AuthService.get_current_user, scopes=["accounts"]),
    session: AsyncSession = Depends(get_session),
) -> ListCustomFieldValueSchema:
    filters = FilterCustomFieldValueSchema(object_type=object_type, object_id=object_id, field_code=field_code)
    filter_params = filters.model_dump(exclude_none=True, exclude_unset=True)
    result = await CustomFieldValueManager.paginate_list(
        where=tuple(getattr(CustomFieldValue, key) == value for key, value in filter_params.items()),
        page=page,
        limit=limit,
        session=session,
    )
    return ListCustomFieldValueSchema(
        pagination=Pagination(limit=result.get("limit"), page=result.get("page"), total=result.get("total")),
        values=result.get("items"),
    )


@custom_field_router.post("/custom-fields/values/", response_model=CustomFieldValueSchema, status_code=status.HTTP_201_CREATED)
async def create_field_value(
    body: CreateCustomFieldValueSchema,
    user = Security(AuthService.get_current_user, scopes=["accounts"]),
    session: AsyncSession = Depends(get_session),
) -> CustomFieldValueSchema:
    async with transaction(session):
        data = body.model_dump(exclude_unset=True)
        data["account_id"] = user.account_id
        return await CustomFieldValueManager.create(input_data=data, session=session)


@custom_field_router.patch("/custom-fields/values/{value_id}/", response_model=CustomFieldValueSchema)
async def update_field_value(
    value_id: int,
    body: CustomFieldValueSchema,
    user = Security(AuthService.get_current_user, scopes=["accounts"]),
    session: AsyncSession = Depends(get_session),
):
    async with transaction(session):
        return await CustomFieldValueManager.update(session=session, pk=value_id, input_data=body.model_dump(exclude_unset=True))


