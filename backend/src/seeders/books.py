import logging
from itertools import cycle
from random import Random

from sqlalchemy import select
from database.relational_db import UoW, Book, Author, Genre, ExchangeLocation, Language, User
from domain.books import Condition, ApprovalStatus
from .registry import BaseSeeder, register

logger = logging.getLogger(__name__)

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

        if not books:
            logger.info("No new books to seed.")
            return 0

        session.add_all(books)
        await uow.flush()
        logger.info("Seeded %d books.", len(books))
        return len(books)
