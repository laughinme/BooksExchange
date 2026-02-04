from typing import Annotated
from fastapi import APIRouter, Depends, Path, HTTPException

from domain.books import AuthorModel
from core.config import Settings
from core.security import auth_user
from service.books import BookService, get_books_service

router = APIRouter()
config = Settings() # pyright: ignore[reportCallIssue]


@router.get(
    path='',
    response_model=AuthorModel,
    summary='Get specific author by its id',
    responses={404: {'description': 'Genre with this `genre_id` not found'}},
)
async def get_author(
    genre_id: Annotated[int, Path(...)],
    # _: Annotated[User, Depends(auth_user)],
    svc: Annotated[BookService, Depends(get_books_service)],
):
    genre = await svc.get_genre(genre_id)
    if genre is None:
        raise HTTPException(404, detail='Genre with this `genre_id` not found')
    
    return genre
