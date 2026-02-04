from typing import Annotated
from fastapi import APIRouter, Depends, Query

from domain.exchanges import ExchangeModel
from core.security import auth_user
from service.exchanges import ExchangeService, get_exchanges_service
from database.relational_db import User

router = APIRouter()


@router.get(
    path='',
    response_model=list[ExchangeModel],
    summary='List all exchanges related to current user',
)
async def list_all_exchanges(
    user: Annotated[User, Depends(auth_user)],
    svc: Annotated[ExchangeService, Depends(get_exchanges_service)],
    only_active: bool = Query(True, description='Return only active exchanges'),
    limit: int = Query(50, description='Number of exchanges to return'),
):
    return await svc.list_all(only_active, limit)


@router.get(
    path='/owned',
    response_model=list[ExchangeModel],
    summary='List exchanges where current user is the owner',
)
async def list_owned_exchanges(
    user: Annotated[User, Depends(auth_user)],
    svc: Annotated[ExchangeService, Depends(get_exchanges_service)],
    only_active: bool = Query(True, description='Return only active exchanges'),
    limit: int = Query(50, description='Number of exchanges to return'),
):
    exchanges = await svc.list_owned(user, only_active, limit)
    return exchanges


@router.get(
    path='/requested',
    response_model=list[ExchangeModel],
    summary='List exchanges requested by current user',
)
async def list_requested_exchanges(
    user: Annotated[User, Depends(auth_user)],
    svc: Annotated[ExchangeService, Depends(get_exchanges_service)],
    only_active: bool = Query(True, description='Return only active exchanges'),
    limit: int = Query(50, description='Number of exchanges to return'),
):
    exchanges = await svc.list_requested(user, only_active, limit)
    return exchanges
