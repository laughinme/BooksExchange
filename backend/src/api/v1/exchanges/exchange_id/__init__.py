from fastapi import APIRouter, Depends


def get_specific_exchange_router() -> APIRouter:
    from .info import router as info_router
    from .progress import router as progress_router
    from .finish import router as finish_router
    
    router = APIRouter(
        responses={404: {'description': 'Exchange with this `exchange_id` not found.'}}
    )

    router.include_router(info_router)
    router.include_router(progress_router, prefix='/{exchange_id}')
    router.include_router(finish_router, prefix='/{exchange_id}')
    
    return router
