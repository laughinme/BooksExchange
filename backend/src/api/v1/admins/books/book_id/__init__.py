from fastapi import APIRouter


def get_book_id_router() -> APIRouter:
    from .moderation import router as moderation_router
    
    router = APIRouter(prefix='/{book_id:uuid}')

    router.include_router(moderation_router)
    
    return router
