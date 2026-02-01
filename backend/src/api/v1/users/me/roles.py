from typing import Annotated
from fastapi import APIRouter, Depends

from database.relational_db import User
from domain.users import UserRoles
from core.config import Settings
from core.security import auth_user

router = APIRouter()
config = Settings() # pyright: ignore[reportCallIssue]


@router.get(
    path='/roles',
    response_model=list[UserRoles],
    summary='Get user roles'
)
async def get_my_roles(
    user: Annotated[User, Depends(auth_user)],
):
    return user.roles
