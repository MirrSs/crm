from fastapi import APIRouter, Depends, status, Query
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from db.postgres.db import get_session
from db.transaction import transaction
from schemas.pagination_schema import Pagination
from schemas.contact_schema import (
    CreateContactSchema,
    ContactSchema,
    FilterContactSchema,
    ListContactSchema,
)
from managers.contact_manager import ContactManager
from models.contact_model import Contact


contact_router = APIRouter(tags=["contacts"])


@contact_router.get("/contacts/{contact_id}/", response_model=ContactSchema)
async def get_contact(
    contact_id: int, session: AsyncSession = Depends(get_session)
) -> ContactSchema:
    return await ContactManager.retrieve(id=contact_id, session=session)


@contact_router.get("/contacts/", response_model=ListContactSchema)
async def get_contacts_list(
    page: int = Query(1, ge=1),
    limit: int = Query(10, le=100),
    id: Optional[int] = Query(None),
    first_name: Optional[str] = Query(None),
    last_name: Optional[str] = Query(None),
    email: Optional[str] = Query(None),
    phone: Optional[str] = Query(None),
    company_id: Optional[int] = Query(None),
    account_id: Optional[int] = Query(None),
    owner_user_id: Optional[int] = Query(None),
    session: AsyncSession = Depends(get_session),
) -> ListContactSchema:
    filters = FilterContactSchema(
        id=id,
        first_name=first_name,
        last_name=last_name,
        email=email,
        phone=phone,
        company_id=company_id,
        account_id=account_id,
        owner_user_id=owner_user_id,
    )
    filter_params = filters.model_dump(exclude_none=True, exclude_unset=True)
    result = await ContactManager.paginate_list(
        where=tuple(getattr(Contact, key) == value for key, value in filter_params.items()),
        page=page,
        limit=limit,
        session=session,
    )
    return ListContactSchema(
        pagination=Pagination(
            limit=result.get("limit"),
            page=result.get("page"),
            total=result.get("total"),
        ),
        contacts=result.get("items"),
    )


@contact_router.post(
    "/contacts/",
    response_model=ContactSchema,
    status_code=status.HTTP_201_CREATED,
)
async def create_contact(
    contact: CreateContactSchema, session: AsyncSession = Depends(get_session)
) -> ContactSchema:
    async with transaction(session):
        response = await ContactManager.create(input_data=contact, session=session)
    return response


@contact_router.patch("/contacts/{contact_id}/", response_model=ContactSchema)
async def update_contact(
    contact_id: int,
    contact: ContactSchema,
    session: AsyncSession = Depends(get_session),
):
    async with transaction(session):
        return await ContactManager.update(
            session=session,
            pk=contact_id,
            input_data=contact.model_dump(exclude_unset=True),
        )


@contact_router.delete("/contacts/{contact_id}/", status_code=status.HTTP_200_OK)
async def delete_contact(
    contact_id: int,
    session: AsyncSession = Depends(get_session),
):
    async with transaction(session):
        return await ContactManager.delete(id=contact_id, session=session)


