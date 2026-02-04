from typing import Annotated
from fastapi import APIRouter, Depends, Query

from core.security import require
from database.relational_db import User
from domain.users import UserModel, Gender
from service.users import UserService, get_user_service
from domain.common import CursorPage

router = APIRouter()


@router.get(
    path='/users',
    response_model=CursorPage[UserModel],
    summary='List users with filters and search (cursor pagination)',
)
async def list_users(
    _: Annotated[User, Depends(require('admin'))],
    svc: Annotated[UserService, Depends(get_user_service)],
    city_id: int | None = Query(None, description='Filter by city id'),
    banned: bool | None = Query(None, description='Filter by banned status'),
    gender: Gender | None = Query(None, description='Filter by gender'),
    min_age: int | None = Query(None, ge=0, description='Minimum age'),
    max_age: int | None = Query(None, ge=0, description='Maximum age'),
    search: str | None = Query(None, description='Search by username or email'),
    limit: int = Query(50, ge=1, le=100, description='Page size'),
    cursor: str | None = Query(None, description='Opaque cursor'),
):
    users, next_cursor = await svc.admin_list_users(
        city_id=city_id,
        banned=banned,
        gender=gender,
        min_age=min_age,
        max_age=max_age,
        search=search,
        limit=limit,
        cursor=cursor,
    )
    return CursorPage(items=users, next_cursor=next_cursor)
