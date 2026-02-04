from fastapi import APIRouter


def get_roles_router() -> APIRouter:
    from .list import router as list_router
    
    router = APIRouter(
        tags=['Roles'],
        responses={401: {"description": "Not authorized"}}
    )

    router.include_router(list_router)
    
    return router
