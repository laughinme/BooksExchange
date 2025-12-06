import asyncio
import logging
from datetime import datetime, timedelta
from typing import AsyncGenerator
from contextlib import asynccontextmanager

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import(
    create_async_engine,
    async_sessionmaker,
    AsyncSession, 
    AsyncEngine
)

from core.config import Settings
from .unit_of_work import UoW

config = Settings() # pyright: ignore[reportCallIssue]
logger = logging.getLogger(__name__)

engine: AsyncEngine = create_async_engine(config.DATABASE_URL, echo=config.ECHO_MODE)
async_session: async_sessionmaker[AsyncSession] = async_sessionmaker(engine, expire_on_commit=False)


async def wait_for_db(timeout: int = 15, retry_interval: int = 3) -> None:
    start_time = datetime.now()
    deadline = start_time + timedelta(seconds=timeout)
    attempt = 0

    logger.info("Attempting to connect to database...")
    
    while datetime.now() < deadline:
        attempt += 1
        try:
            async with async_session() as session:
                await session.execute(text("SELECT 1"))
                logger.info("Successfully connected to database on attempt %d", attempt)
                return
        except SQLAlchemyError as e:
            remaining = (deadline - datetime.now()).seconds
            logger.warning(
                "Database connection attempt %d failed, retrying for %d more seconds. Error: %s",
                attempt, remaining, str(e)
            )
            await asyncio.sleep(retry_interval)
        except Exception as e:
            remaining = (deadline - datetime.now()).seconds
            logger.error(
                "Unexpected error during database connection attempt %d: %s. Retrying for %d more seconds.",
                attempt, str(e), remaining
            )
            await asyncio.sleep(retry_interval)
    
    raise RuntimeError(
        f"Could not establish database connection after {timeout} seconds and {attempt} attempts. "
        f"Please check if the database is running and accessible."
    )


async def get_uow() -> AsyncGenerator[UoW, None]:
    """Yields Unit of Work instead of raw sessions."""
    async with async_session() as session:
        async with UoW(session) as uow:
            yield uow
