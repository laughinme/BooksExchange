from typing import Annotated
from fastapi import APIRouter, Depends, Query

from database.relational_db import User
from domain.statistics import ActiveUsersGraph, RegistrationsGraph
from core.config import Settings
from core.security import require
from service.statistics import StatService, get_stats_service

router = APIRouter()
config = Settings() # pyright: ignore[reportCallIssue]


@router.get(    
    path='/active-users',
    response_model=list[ActiveUsersGraph],
    summary='Get graph data for active users by days',
)
async def active_users(
    _: Annotated[User, Depends(require('admin'))],
    svc: Annotated[StatService, Depends(get_stats_service)],
    days: int = Query(30, description='Number of days back to retrieve data for'),
):
    return await svc.active_users(days)

@router.get(    
    path='/registrations',
    response_model=list[RegistrationsGraph],
    summary='Get graph data for new registrations by days',
)
async def registrations(
    _: Annotated[User, Depends(require('admin'))],
    svc: Annotated[StatService, Depends(get_stats_service)],
    days: int = Query(30, description='Number of days back to retrieve data for'),
):
    return await svc.new_registrations(days)
