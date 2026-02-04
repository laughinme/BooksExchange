from typing import Annotated
from uuid import UUID
from fastapi import APIRouter, Depends, Path, HTTPException

from domain.exchanges import ExchangeModel, ExchangeCancel, ExchangeEdit
from core.config import Settings
from core.security import auth_user
from service.exchanges import ExchangeService, get_exchanges_service
from database.relational_db import User

router = APIRouter()
config = Settings() # pyright: ignore[reportCallIssue]


@router.patch(
    path='/accept',
    response_model=ExchangeModel,
    summary='Accept exchange request',
)
async def accept_exchange_request(
    exchange_id: Annotated[UUID, Path(...)],
    user: Annotated[User, Depends(auth_user)],
    svc: Annotated[ExchangeService, Depends(get_exchanges_service)],
):
    return await svc.accept_exchange(exchange_id, user)


@router.patch(
    path='/decline',
    response_model=ExchangeModel,
    summary='Decline exchange request',
)
async def decline_exchange_request(
    payload: ExchangeCancel,
    exchange_id: Annotated[UUID, Path(...)],
    user: Annotated[User, Depends(auth_user)],
    svc: Annotated[ExchangeService, Depends(get_exchanges_service)],
):
    return await svc.decline_exchange(exchange_id, user, payload)


@router.patch(
    path='/cancel',
    response_model=ExchangeModel,
    summary='Cancel exchange',
)
async def cancel_exchange(
    payload: ExchangeCancel,
    exchange_id: Annotated[UUID, Path(...)],
    user: Annotated[User, Depends(auth_user)],
    svc: Annotated[ExchangeService, Depends(get_exchanges_service)],
):
    return await svc.cancel_exchange(exchange_id, user, payload)


@router.patch(
    path='',
    response_model=ExchangeModel,
    summary='Edit exchange terms',
)
async def edit_exchange(
    payload: ExchangeEdit,
    exchange_id: Annotated[UUID, Path(...)],
    user: Annotated[User, Depends(auth_user)],
    svc: Annotated[ExchangeService, Depends(get_exchanges_service)],
):
    return await svc.update_exchange(exchange_id, user, payload)
