from typing import Annotated
from fastapi import APIRouter, Depends, Query, HTTPException

from database.relational_db import User
from domain.books import BookModel
from core.config import Settings
from core.security import auth_user
from service.books import BookService, get_books_service

router = APIRouter()
config = Settings() # pyright: ignore[reportCallIssue]


@router.get(
    path='/for_you',
    response_model=list[BookModel],
    summary='Get books for "For You" page',
)
async def for_you(
    user: Annotated[User, Depends(auth_user)],
    svc: Annotated[BookService, Depends(get_books_service)],
    query: str | None = Query(None, max_length=50),
    limit: int | None = Query(None, ge=1, le=50),
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
    limit_ = limit or (50 if query == "" else 10)

    books = await svc.list_books(
        user,
        limit_,
        filter=True,
        query=query,
        sort=sort,
        genre=genre,
        max_distance=distance,
        min_rating=rating,
    )
    return books
