from fastapi import APIRouter


def get_exchanges_router() -> APIRouter:
    from .list import router as list_router
    from .exchange_id import get_exchange_id_router
    
    router = APIRouter()

    router.include_router(list_router)
    router.include_router(get_exchange_id_router(), prefix='/exchanges')
    
    return router
