from fastapi import APIRouter, Depends
from core.security import auth_user


def get_authors_router() -> APIRouter:
    from .list import router as list_router
    from .author_id import get_specific_author_router
    
    router = APIRouter()

    router.include_router(list_router)
    router.include_router(get_specific_author_router(), prefix='/authors')
    
    return router
