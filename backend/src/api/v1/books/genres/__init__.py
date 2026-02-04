from fastapi import APIRouter, Depends
from core.security import auth_user


def get_genres_router() -> APIRouter:
    from .list import router as list_router
    from .genre_id import get_specific_genre_router
    
    router = APIRouter()

    router.include_router(list_router)
    router.include_router(get_specific_genre_router(), prefix='/genres')
    
    return router
