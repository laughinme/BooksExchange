from typing import Annotated
from uuid import UUID
from fastapi import APIRouter, Depends, Query

from database.relational_db import User
from domain.statistics import BookStatsGraph
from core.config import Settings
from core.security import require
from service.statistics import StatService, get_stats_service

router = APIRouter()
config = Settings() # pyright: ignore[reportCallIssue]


@router.get(
    path='/stats',
    response_model=list[BookStatsGraph],
    summary='Get graph data for a single book: views, likes, reserves by days',
)
async def stats_by_book(
    _: Annotated[User, Depends(require('admin'))],
    svc: Annotated[StatService, Depends(get_stats_service)],
    book_id: UUID,
    days: int = Query(30, description='Number of days back to retrieve data for'),
):
    return await svc.books_stats(days, book_id)
