from typing import Annotated
from fastapi import APIRouter, Depends, Query, Response, HTTPException

from domain.misc import LanguageModel
from service.users import UserService, get_user_service


router = APIRouter()


@router.get(
    path='/languages',
    response_model=list[LanguageModel],
    summary='List all languages'
)
async def list_languages(
    response: Response,
    svc: Annotated[UserService, Depends(get_user_service)],
    query: str | None = Query(None, max_length=50),
    limit: int | None = Query(None, ge=1, le=50),
):
    if not query:
        if limit is not None:
            raise HTTPException(400, detail="Limit is not allowed when query is empty")
        limit_ = 50
        response.headers["Cache-Control"] = "max-age=86400"
    else:
        limit_ = limit or 10

    return await svc.list_languages(query, limit_)
