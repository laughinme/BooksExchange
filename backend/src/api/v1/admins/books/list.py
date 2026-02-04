from typing import Annotated
from fastapi import APIRouter, Depends, Query

from database.relational_db import User
from domain.books import BookModel, ApprovalStatus
from core.config import Settings
from core.security import require
from service.books import BookService, get_books_service

router = APIRouter()
config = Settings() # pyright: ignore[reportCallIssue]


@router.get(
    path='/books',
    response_model=list[BookModel],
    summary='List all books with filters',
)
async def get_books(
    _: Annotated[User, Depends(require('admin'))],
    svc: Annotated[BookService, Depends(get_books_service)],
    status: ApprovalStatus = Query(ApprovalStatus.PENDING, description='Approval status to filter by'),
    # query: str = Query(None, description='Search by title or author'),
    limit: int = Query(50, description='Number of books to return'),
):
    books = await svc.list_books_for_approval(status, limit)
    return books
