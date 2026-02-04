from fastapi import APIRouter


def get_book_id_router() -> APIRouter:
    from .graphs import router as graphs_router
    
    router = APIRouter(prefix='/{book_id:uuid}')

    router.include_router(graphs_router)
    
    return router
