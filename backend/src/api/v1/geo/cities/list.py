from typing import Annotated
from fastapi import APIRouter, Depends

from domain.geo import CityModel
from core.config import Settings
from core.security import auth_user
from service.geo import GeoService, get_geo_service

router = APIRouter()
config = Settings() # pyright: ignore[reportCallIssue]


@router.get(
    path='/cities',
    response_model=list[CityModel],
    summary='List all supported cities'
)
async def list_cities(
    # _: Annotated[User, Depends(auth_user)],
    svc: Annotated[GeoService, Depends(get_geo_service)],
):
    return await svc.list_cities()
