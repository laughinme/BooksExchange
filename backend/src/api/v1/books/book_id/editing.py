from typing import Annotated
from uuid import UUID
from fastapi import APIRouter, Depends, Path

from database.relational_db import User
from domain.books import BookModel, BookPatch
from core.security import auth_user
from service.books import BookService, get_books_service

router = APIRouter()

@router.patch(
    "",
    response_model=BookModel,
    summary="Edit book data",
)
async def reserve_book(
    payload: BookPatch,
    book_id: Annotated[UUID, Path(...)],
    user: Annotated[User, Depends(auth_user)],
    svc: Annotated[BookService, Depends(get_books_service)],
):
    return await svc.edit_book(payload, book_id, user)
