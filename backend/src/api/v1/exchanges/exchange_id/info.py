from typing import Annotated
from uuid import UUID
from fastapi import APIRouter, Depends, Path, HTTPException

from domain.exchanges import ExchangeModel
from core.config import Settings
from core.security import auth_user
from service.exchanges import ExchangeService, get_exchanges_service
from database.relational_db import User

router = APIRouter()
config = Settings() # pyright: ignore[reportCallIssue]


@router.get(
    path='/{exchange_id}',
    response_model=ExchangeModel,
    summary='Get specific exchange',
)
async def get_exchange(
    exchange_id: Annotated[UUID, Path(...)],
    user: Annotated[User, Depends(auth_user)],
    svc: Annotated[ExchangeService, Depends(get_exchanges_service)],
):
    return await svc.get_exchange(exchange_id, user)
