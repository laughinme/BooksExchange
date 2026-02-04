import asyncio
import logging

from core.config import configure_logging
from database.relational_db.session import async_session, wait_for_db, UoW

from .registry import SEEDERS
from .books import BooksSeeder  # ensure registration


logger = logging.getLogger(__name__)


async def run_seeders() -> None:
    if not SEEDERS:
        logger.info("No seeders registered. Exiting.")
        return

    await wait_for_db()

    for seeder_cls in SEEDERS:
        seeder = seeder_cls()
        logger.info("Running seeder: %s", seeder.name)
        async with async_session() as session:
            async with UoW(session) as uow:
                inserted = await seeder.run(uow)
        logger.info("Seeder %s completed. Inserted: %d", seeder.name, inserted)


def main() -> None:
    configure_logging()
    asyncio.run(run_seeders())


if __name__ == "__main__":
    main()
