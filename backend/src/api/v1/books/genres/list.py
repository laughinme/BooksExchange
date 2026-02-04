from typing import Annotated
from fastapi import APIRouter, Depends

from database.relational_db import User
from domain.books import GenreModel
from core.config import Settings
from core.security import auth_user
from service.books import BookService, get_books_service

router = APIRouter()
config = Settings() # pyright: ignore[reportCallIssue]


@router.get(
    path='/genres',
    response_model=list[GenreModel],
    summary='List all available genres'
)
async def list_genres(
    # _: Annotated[User, Depends(auth_user)],
    svc: Annotated[BookService, Depends(get_books_service)],
):
    return await svc.list_genres()
