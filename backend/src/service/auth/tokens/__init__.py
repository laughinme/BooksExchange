from fastapi import Depends
from redis.asyncio import Redis

from database.redis import CacheRepo, get_redis
from database.relational_db import UserInterface, UoW, get_uow
from .token_service import TokenService


async def get_token_service(
    uow: UoW = Depends(get_uow),
    redis: Redis = Depends(get_redis),
) -> TokenService:
    cache_repo = CacheRepo(redis)
    user_repo = UserInterface(uow.session)
    return TokenService(cache_repo, user_repo)
