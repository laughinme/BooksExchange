from typing import Annotated
from uuid import UUID
from fastapi import APIRouter, Depends, Path

from domain.statistics.enums import Interaction
from domain.books import BookDetailModel
from core.config import Settings
from core.security import auth_user
from service.books import BookService, get_books_service
from service.statistics import StatService, get_stats_service
from database.relational_db import User

router = APIRouter()
config = Settings() # pyright: ignore[reportCallIssue]


@router.get(
    path='/{book_id:uuid}',
    response_model=BookDetailModel,
    summary='Get specific book by its id',
)
async def get_book_detail(
    book_id: Annotated[UUID, Path(...)],
    user: Annotated[User, Depends(auth_user)],
    book_svc: Annotated[BookService, Depends(get_books_service)],
    stats_svc: Annotated[StatService, Depends(get_stats_service)],
):
    book = await book_svc.get_book_detail(book_id, user)
    await stats_svc.record_interaction(book_id, user, Interaction.CLICK)
    
    return book
