from typing import Annotated
from fastapi import APIRouter, Depends, Query

from database.relational_db import User
from domain.books import BookModel
from core.config import Settings
from core.security import auth_user
from service.books import BookService, get_books_service

router = APIRouter()
config = Settings() # pyright: ignore[reportCallIssue]


@router.get(
    path='/books',
    response_model=list[BookModel],
    summary='List all books without filters',
)
async def get_books(
    user: Annotated[User, Depends(auth_user)],
    svc: Annotated[BookService, Depends(get_books_service)],
    query: str | None = Query(None, max_length=50, description="Search by title/author/genre"),
    limit: int = Query(50, ge=1, le=200, description='Number of books to return'),
    sort: str | None = Query(
        None,
        description="Sort by: newest | distance | rating",
        pattern="^(newest|distance|rating)$"
    ),
    genre: str | None = Query(
        None,
        description="Filter by genre name or id"
    ),
    distance: float | None = Query(
        None,
        ge=0,
        description="Max distance in km from user to exchange location"
    ),
    rating: float | None = Query(
        None,
        ge=0,
        le=5,
        description="Minimum rating (pseudo, based on likes)"
    ),
):
    books = await svc.list_books(
        user,
        limit,
        filter=False,
        query=query,
        sort=sort,
        genre=genre,
        max_distance=distance,
        min_rating=rating,
    )
    return books


@router.get(
    path='/books/my',
    response_model=list[BookModel],
    summary='List all books that belong to the current user',
)
async def get_my_books(
    user: Annotated[User, Depends(auth_user)],
    svc: Annotated[BookService, Depends(get_books_service)],
    limit: int = Query(50, description='Number of books to return'),
):
    books = await svc.list_user_books(user, limit)
    return books
