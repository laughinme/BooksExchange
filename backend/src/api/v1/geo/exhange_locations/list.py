from typing import Annotated
from fastapi import APIRouter, Depends, Query

from database.relational_db import User
from domain.geo import ExchangeLocation
from core.config import Settings
from core.security import auth_user
from service.geo import GeoService, get_geo_service

router = APIRouter()
config = Settings() # pyright: ignore[reportCallIssue]


@router.get(
    path='',
    response_model=list[ExchangeLocation],
    summary='List all exchange points sorted by distance to the user',
)
async def list_locations(
    user: Annotated[User, Depends(auth_user)],
    svc: Annotated[GeoService, Depends(get_geo_service)],
    limit: int = Query(30),
    filter: bool = Query(True, description='Whether to sort points by distance from the user'),
):
    return await svc.list_locations(user, filter, limit)
