from fastapi import APIRouter


def get_exchanges_router() -> APIRouter:
    from .list import router as list_router
    from .exchange_id import get_specific_exchange_router

    router = APIRouter(
        tags=['Exchanges'],
        responses={401: {"description": "Not authorized"}}
    )

    router.include_router(list_router)
    router.include_router(get_specific_exchange_router(), prefix='/exchanges')

    return router
