from typing import Annotated
from fastapi import APIRouter, Depends, Path, HTTPException

from domain.books import BookModel
from core.config import Settings
from core.security import auth_user
from service.geo import GeoService, get_geo_service

router = APIRouter()
config = Settings() # pyright: ignore[reportCallIssue]


@router.get(
    path='',
    response_model=BookModel,
    summary='Get specific location by its id',
    responses={404: {'description': 'Location with this `location_id` not found'}},
)
async def get_location(
    location_id: Annotated[int, Path(...)],
    # _: Annotated[User, Depends(auth_user)],
    svc: Annotated[GeoService, Depends(get_geo_service)],
):
    location = await svc.get_location(location_id)
    if location is None:
        raise HTTPException(404, detail='Location with this `location_id` not found')
    
    return location
