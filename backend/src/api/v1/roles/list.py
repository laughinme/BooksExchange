from uuid import UUID
from typing import Annotated
from fastapi import APIRouter, Depends, Query, Path

from domain.roles import RoleModel
from service.users import UserService, get_user_service

router = APIRouter()


@router.get(
    path='/',
    response_model=list[RoleModel],
    summary='List all roles'
)
async def list_roles(
    svc: Annotated[UserService, Depends(get_user_service)],
    search: str | None = Query(None, description='Search by slug or name'),
    limit: int = Query(20, ge=1, le=100, description='Number of roles to return'),
):
    return await svc.list_roles(search=search, limit=limit)

