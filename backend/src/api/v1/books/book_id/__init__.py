from fastapi import APIRouter, Depends


def get_specific_book_router() -> APIRouter:
    from .info import router as info_router
    from .editing import router as edit_router
    from .photos import router as photos_router
    from .interactions import router as interactions_router
    
    router = APIRouter(
        responses={404: {'description': 'Book with this `book_id` not found.'}}
    )

    router.include_router(info_router)
    router.include_router(edit_router)
    router.include_router(photos_router, prefix='/{book_id:uuid}')
    router.include_router(interactions_router, prefix='/{book_id:uuid}')
    
    return router
