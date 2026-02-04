from fastapi import APIRouter


def get_books_router() -> APIRouter:
    from .list import router as list_router
    from .book_id import get_book_id_router
    
    router = APIRouter()

    router.include_router(list_router)
    router.include_router(get_book_id_router(), prefix='/books')
    
    return router
