from typing import Annotated
from fastapi import APIRouter, Depends, Query

from database.relational_db import User
from domain.exchanges import ExchangeModel, ExchangeProgress
from domain.common import CursorPage
from core.config import Settings
from core.security import require
from service.exchanges import ExchangeService, get_exchanges_service

router = APIRouter()
config = Settings() # pyright: ignore[reportCallIssue]


@router.get(
    path='',
    response_model=CursorPage[ExchangeModel],
    summary='List all exchanges (cursor pagination)',
)
async def list_exchanges(
    _: Annotated[User, Depends(require('admin'))],
    svc: Annotated[ExchangeService, Depends(get_exchanges_service)],
    status: ExchangeProgress | None = Query(None, description='Filter by exchange status'),
    limit: int = Query(50, ge=1, le=100, description='Page size'),
    cursor: str | None = Query(None, description='Opaque cursor'),
):
    exchanges, next_cursor = await svc.admin_list_exchanges(
        status=status,
        limit=limit,
        cursor=cursor,
    )
    return CursorPage(items=exchanges, next_cursor=next_cursor)
