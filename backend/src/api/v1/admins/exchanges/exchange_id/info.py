from typing import Annotated
from uuid import UUID
from fastapi import APIRouter, Depends, Path

from domain.exchanges import ExchangeModel
from core.config import Settings
from core.security import require
from service.exchanges import ExchangeService, get_exchanges_service
from database.relational_db import User

router = APIRouter()
config = Settings() # pyright: ignore[reportCallIssue]


@router.get(
    path='/{exchange_id}',
    response_model=ExchangeModel,
    summary='Get specific exchange (admin)',
)
async def get_exchange_admin(
    exchange_id: Annotated[UUID, Path(...)],
    _: Annotated[User, Depends(require('admin'))],
    svc: Annotated[ExchangeService, Depends(get_exchanges_service)],
):
    return await svc.admin_get_exchange(exchange_id)


