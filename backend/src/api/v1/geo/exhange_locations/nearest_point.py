from typing import Annotated
from fastapi import APIRouter, Depends

from database.relational_db import User
from domain.geo import ExchangeLocation
from core.config import Settings
from core.security import auth_user
from service.geo import GeoService, get_geo_service

router = APIRouter()
config = Settings() # pyright: ignore[reportCallIssue]


@router.get(
    path='/exchange_locations/nearest',
    response_model=ExchangeLocation,
    summary='Get nearest exchange point to user'
)
async def nearest_point(
    user: Annotated[User, Depends(auth_user)],
    svc: Annotated[GeoService, Depends(get_geo_service)],
):
    return await svc.nearest_point(user)
