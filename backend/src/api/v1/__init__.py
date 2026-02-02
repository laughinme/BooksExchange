from fastapi import APIRouter


def get_v1_router() -> APIRouter:
    from .auth import get_auth_routers
    from .admins import get_admins_router
    from .users import get_users_router
    from .books import get_books_router
    from .geo import get_geo_router
    from .exchanges import get_exchanges_router
    from .misc import get_misc_router
    from .roles import get_roles_router

    router = APIRouter(prefix='/v1')

    router.include_router(get_auth_routers())
    router.include_router(get_admins_router())
    router.include_router(get_users_router())
    router.include_router(get_books_router())
    router.include_router(get_geo_router())
    router.include_router(get_exchanges_router())
    router.include_router(get_misc_router())
    router.include_router(get_roles_router())
    
    return router
