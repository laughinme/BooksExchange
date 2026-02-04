from typing import Annotated
from uuid import UUID
from fastapi import APIRouter, Depends, Path, HTTPException

from domain.books import AuthorModel
from core.config import Settings
from core.security import auth_user
from service.books import BookService, get_books_service

router = APIRouter()
config = Settings() # pyright: ignore[reportCallIssue]


@router.get(
    path='/{author_id}',
    response_model=AuthorModel,
    summary='Get specific author by its id',
    responses={404: {'description': 'Author with this `author_id` not found'}},
)
async def get_author(
    author_id: Annotated[int, Path(...)],
    # _: Annotated[User, Depends(auth_user)],
    svc: Annotated[BookService, Depends(get_books_service)],
):
    author = await svc.get_author(author_id)
    if author is None:
        raise HTTPException(404, detail='Author with this `author_id` not found')
    
    return author
