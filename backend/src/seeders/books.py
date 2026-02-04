import asyncio
import logging
from itertools import cycle
from pathlib import Path
from random import Random
from uuid import uuid4

from sqlalchemy import select, func
from database.relational_db import UoW, Book, Author, Genre, ExchangeLocation, Language, User
from domain.books import Condition, ApprovalStatus
from core.config import Settings, BASE_DIR
from core.storage import MediaStorage
from .registry import BaseSeeder, register

logger = logging.getLogger(__name__)
settings = Settings()  # type: ignore
storage = MediaStorage()

ADJECTIVES = [
    "Silent",
    "Hidden",
    "Forgotten",
    "Golden",
    "Midnight",
    "Amber",
    "Wandering",
    "Crimson",
    "Shifting",
    "Iron",
]
NOUNS = [
    "Library",
    "Archive",
    "Garden",
    "Compass",
    "Chronicle",
]

BOOK_TITLES = [f"The {adj} {noun}" for adj in ADJECTIVES for noun in NOUNS]

DESCRIPTION_TEMPLATES = [
    "A concise, readable edition prepared for the exchange catalog.",
    "A well-kept copy with clean pages and a sturdy binding.",
    "A sample listing suitable for demos and QA checks.",
    "A curated pick with steady pacing and clear narration.",
    "A classic-style narrative built for easy, relaxed reading.",
]


@register
class BooksSeeder(BaseSeeder):
    name = "books"

    async def run(self, uow: UoW) -> int:
        session = uow.session
        photo_dir = (
            Path(settings.SEED_BOOK_PHOTOS_DIR)
            if settings.SEED_BOOK_PHOTOS_DIR
            else BASE_DIR / "seed_photos" / "books"
        )
        def _collect_photos() -> list[Path]:
            if not photo_dir.exists():
                return []
            return [
                p
                for p in photo_dir.iterdir()
                if p.is_file() and p.suffix.lower() in {".jpg", ".jpeg", ".png"}
            ]

        photo_files = await asyncio.to_thread(_collect_photos)
        if not photo_files:
            logger.info("No seed book photos found in %s.", photo_dir)
        users = (await session.execute(select(User.id).order_by(User.id))).scalars().all()
        if not users:
            logger.warning("No users found; skipping books seeding.")
            return 0

        authors = (await session.execute(
            select(Author.id).order_by(Author.id)
        )).scalars().all()
        if not authors:
            logger.warning("No authors found; skipping books seeding.")
            return 0

        genres = (await session.execute(
            select(Genre.id).order_by(Genre.id)
        )).scalars().all()
        if not genres:
            logger.warning("No genres found; skipping books seeding.")
            return 0

        locations = (await session.execute(
            select(ExchangeLocation.id).where(ExchangeLocation.is_active.is_(True)).order_by(ExchangeLocation.id)
        )).scalars().all()
        if not locations:
            logger.warning("No exchange locations found; skipping books seeding.")
            return 0

        language_codes = (await session.execute(
            select(Language.code).order_by(Language.code)
        )).scalars().all()
        if not language_codes:
            logger.warning("No languages found; skipping books seeding.")
            return 0

        preferred_languages = [code for code in ("ru", "en") if code in language_codes]
        if not preferred_languages:
            preferred_languages = [language_codes[0]]

        existing_pairs = set(
            (row[0], row[1])
            for row in (
                await session.execute(select(Book.title, Book.author_id))
            ).all()
        )

        author_cycle = cycle(authors)
        genre_cycle = cycle(genres)
        user_cycle = cycle(users)
        location_cycle = cycle(locations)
        language_cycle = cycle(preferred_languages)
        condition_cycle = cycle(
            [Condition.NEW, Condition.PERFECT, Condition.GOOD, Condition.NORMAL]
        )
        description_cycle = cycle(DESCRIPTION_TEMPLATES)
        rng = Random(37)

        books: list[Book] = []
        for title in BOOK_TITLES:
            author_id = next(author_cycle)
            if (title, author_id) in existing_pairs:
                continue

            genre_id = next(genre_cycle)
            owner_id = next(user_cycle)
            exchange_location_id = next(location_cycle)
            language_code = next(language_cycle)
            condition = next(condition_cycle)
            description = next(description_cycle)
            pages = rng.randint(120, 820)

            books.append(
                Book(
                    owner_id=owner_id,
                    author_id=author_id,
                    genre_id=genre_id,
                    exchange_location_id=exchange_location_id,
                    title=title,
                    description=description,
                    extra_terms="seed, sample, catalog",
                    language_code=language_code,
                    pages=pages,
                    condition=condition,
                    photo_urls=[],
                    is_available=True,
                    approval_status=ApprovalStatus.APPROVED,
                    moderation_reason=None,
                )
            )

        inserted = 0
        if books:
            session.add_all(books)
            await uow.flush()
            inserted = len(books)
        else:
            logger.info("No new books to seed.")

        photos_assigned = 0
        if photo_files:
            photo_cycle = cycle(photo_files)
            stmt = select(Book).where(
                func.coalesce(func.array_length(Book.photo_urls, 1), 0) == 0
            )
            books_without_photos = (await session.execute(stmt)).scalars().all()
            for book in books_without_photos:
                photo_path = next(photo_cycle)
                ext = photo_path.suffix.lower()
                key = f"books/{book.id}/{uuid4()}{ext}"
                try:
                    url = await storage.upload_file_path(key, photo_path)
                except Exception as exc:
                    logger.warning("Failed to upload seed photo %s: %s", photo_path, exc)
                    continue
                book.photo_urls = [url]
                photos_assigned += 1

        if inserted:
            logger.info("Seeded %d books.", inserted)
        if photos_assigned:
            logger.info("Assigned photos to %d existing books.", photos_assigned)

        return inserted
