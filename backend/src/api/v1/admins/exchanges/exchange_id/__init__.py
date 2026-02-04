from fastapi import APIRouter


def get_exchange_id_router() -> APIRouter:
    from .info import router as info_router
    from .moderation import router as moderation_router
    
    router = APIRouter()

    router.include_router(info_router)
    router.include_router(moderation_router, prefix='/{exchange_id}')
    
    return router


