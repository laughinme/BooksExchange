from fastapi import APIRouter, Depends
from core.security import auth_user


def get_specific_genre_router() -> APIRouter:
    from .info import router as info_router
    
    router = APIRouter()

    router.include_router(info_router)
    
    return router
