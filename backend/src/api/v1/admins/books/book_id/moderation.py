from typing import Annotated
from uuid import UUID
from fastapi import APIRouter, Depends, Path

from database.relational_db import User
from domain.admin import ModerationReason
from domain.books import BookModel
from core.config import Settings
from core.security import require
from service.books import BookService, get_books_service

router = APIRouter()
config = Settings() # pyright: ignore[reportCallIssue]

@router.post(
    path='/accept',
    response_model=BookModel,
    summary='Accept book',
)
async def accept_book(
    book_id: Annotated[UUID, Path(description='Book ID')],
    user: Annotated[User, Depends(require('admin'))],
    svc: Annotated[BookService, Depends(get_books_service)],
):
    book = await svc.approve_book(book_id, user)
    return book


@router.post(
    path='/reject',
    response_model=BookModel,
    summary='Reject book',
)
async def reject_book(
    payload: ModerationReason,
    book_id: Annotated[UUID, Path(description='Book ID')],
    user: Annotated[User, Depends(require('admin'))],
    svc: Annotated[BookService, Depends(get_books_service)],
):
    book = await svc.reject_book(book_id, user, payload.reason)
    return book
