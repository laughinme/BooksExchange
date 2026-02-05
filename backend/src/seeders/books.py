import asyncio
import logging
from itertools import cycle
from pathlib import Path
from random import Random
from uuid import uuid4

from sqlalchemy import select, func
from database.relational_db import (
    UoW,
    Book,
    Author,
    Genre,
    ExchangeLocation,
    Language,
    User,
    City,
    Role,
)
from domain.books import Condition, ApprovalStatus
from core.config import Settings, BASE_DIR
from core.storage import MediaStorage
from core.crypto import hash_password
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

DEFAULT_AUTHORS = [
    "Александр Пушкин",
    "Фёдор Достоевский",
    "Лев Толстой",
    "Антон Чехов",
    "Джейн Остин",
    "Агата Кристи",
]

DEFAULT_GENRES = [
    "Классика",
    "Фэнтези",
    "Детектив",
    "Философия",
    "Фантастика",
]

DEFAULT_CITIES = ["Москва", "Санкт-Петербург"]

DEFAULT_LOCATIONS = [
    {
        "title": "Центральная библиотека",
        "description": "Главный пункт обмена книгами",
        "address": "ул. Ленина, 1",
        "latitude": 55.7558,
        "longitude": 37.6173,
    }
]

SEED_ACCOUNTS = [
    {
        "email": "admin@books.com",
        "password": "admin1234",
        "username": "Admin",
        "roles": ["admin"],
    },
    {
        "email": "demo@books.com",
        "password": "demo1234",
        "username": "Demo user",
        "roles": ["member"],
    },
    {
        "email": "reader@books.com",
        "password": "reader1234",
        "username": "Reader",
        "roles": ["member"],
    },
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
                if p.is_file()
                and p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp", ".avif"}
            ]

        photo_files = await asyncio.to_thread(_collect_photos)
        if not photo_files:
            logger.info("No seed book photos found in %s.", photo_dir.resolve())
        else:
            logger.info("Found %d seed book photos in %s.", len(photo_files), photo_dir.resolve())

        required_role_slugs = {slug for acc in SEED_ACCOUNTS for slug in acc["roles"]}
        role_rows = (await session.execute(
            select(Role).where(Role.slug.in_(required_role_slugs))
        )).scalars().all()
        role_by_slug = {role.slug: role for role in role_rows}
        missing_roles = required_role_slugs - set(role_by_slug.keys())
        if missing_roles:
            logger.warning(
                "Missing roles for seed users: %s",
                ", ".join(sorted(missing_roles)),
            )

        seed_users: list[User] = []
        for account in SEED_ACCOUNTS:
            user = await session.scalar(
                select(User).where(User.email == account["email"])
            )
            if user is None:
                logger.info("Seed user %s is missing; creating.", account["email"])
                password_hash = await hash_password(account["password"])
                user = User(
                    email=account["email"],
                    password_hash=password_hash,
                    username=account["username"],
                    public=True,
                    is_onboarded=True,
                )
                session.add(user)
            else:
                if settings.APP_STAGE == "dev":
                    user.password_hash = await hash_password(account["password"])
                    
                if not user.username:
                    user.username = account["username"]
                    
                user.public = True
                user.is_onboarded = True
            seed_users.append(user)

        await uow.flush()

        for account, user in zip(SEED_ACCOUNTS, seed_users):
            desired = [
                role_by_slug[slug]
                for slug in account["roles"]
                if slug in role_by_slug
            ]
            if not desired:
                continue
            existing = {role.slug for role in user.roles}
            for role in desired:
                if role.slug not in existing:
                    user.roles.append(role)

        seed_owner_ids = [user.id for user in seed_users if user.id]
        if not seed_owner_ids:
            fallback_owner_id = await session.scalar(
                select(User.id).order_by(User.id)
            )
            if fallback_owner_id is None:
                logger.warning("No users available for book ownership; skipping books.")
                return 0
            seed_owner_ids = [fallback_owner_id]

        authors = (await session.execute(
            select(Author.id).order_by(Author.id)
        )).scalars().all()
        if not authors:
            logger.info("No authors found; creating default authors.")
            session.add_all([Author(name=name) for name in DEFAULT_AUTHORS])
            await uow.flush()
            authors = (await session.execute(
                select(Author.id).order_by(Author.id)
            )).scalars().all()

        genres = (await session.execute(
            select(Genre.id).order_by(Genre.id)
        )).scalars().all()
        if not genres:
            logger.info("No genres found; creating default genres.")
            session.add_all([Genre(name=name) for name in DEFAULT_GENRES])
            await uow.flush()
            genres = (await session.execute(
                select(Genre.id).order_by(Genre.id)
            )).scalars().all()

        language_codes = (await session.execute(
            select(Language.code).order_by(Language.code)
        )).scalars().all()
        if not language_codes:
            logger.info("No languages found; creating default languages.")
            session.add_all(
                [
                    Language(code="ru", name_ru="Русский", name_en="Russian"),
                    Language(code="en", name_ru="Английский", name_en="English"),
                ]
            )
            await uow.flush()
            language_codes = (await session.execute(
                select(Language.code).order_by(Language.code)
            )).scalars().all()

        locations = (await session.execute(
            select(ExchangeLocation.id)
            .where(ExchangeLocation.is_active.is_(True))
            .order_by(ExchangeLocation.id)
        )).scalars().all()
        if not locations:
            cities = (await session.execute(
                select(City).order_by(City.id)
            )).scalars().all()
            if not cities:
                logger.info("No cities found; creating default cities.")
                session.add_all([City(name=name) for name in DEFAULT_CITIES])
                await uow.flush()
                cities = (await session.execute(
                    select(City).order_by(City.id)
                )).scalars().all()
            logger.info("No exchange locations found; creating default locations.")
            locations_payload = []
            for city in cities:
                for loc in DEFAULT_LOCATIONS:
                    locations_payload.append(
                        ExchangeLocation(
                            city_id=city.id,
                            title=f"{loc['title']} ({city.name})",
                            description=loc["description"],
                            address=loc["address"],
                            latitude=loc["latitude"],
                            longitude=loc["longitude"],
                            is_active=True,
                        )
                    )
            session.add_all(locations_payload)
            await uow.flush()
            locations = (await session.execute(
                select(ExchangeLocation.id)
                .where(ExchangeLocation.is_active.is_(True))
                .order_by(ExchangeLocation.id)
            )).scalars().all()

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
        location_cycle = cycle(locations)
        language_cycle = cycle(preferred_languages)
        owner_cycle = cycle(seed_owner_ids)
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
            owner_id = next(owner_cycle)
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

        rewritten = 0
        if storage.s3_enabled:
            endpoint = (settings.S3_ENDPOINT_URL or "").rstrip("/")
            bucket = settings.S3_BUCKET or ""
            legacy_base = f"{endpoint}/{bucket}" if endpoint and bucket else ""
            public_base = storage._public_base_url()
            if legacy_base and legacy_base != public_base:
                stmt = select(Book).where(
                    func.coalesce(func.array_length(Book.photo_urls, 1), 0) > 0
                )
                books_with_urls = (await session.execute(stmt)).scalars().all()
                for book in books_with_urls:
                    updated = False
                    new_urls: list[str] = []
                    for url in book.photo_urls:
                        if url.startswith(legacy_base):
                            new_urls.append(url.replace(legacy_base, public_base, 1))
                            updated = True
                        else:
                            new_urls.append(url)
                    if updated:
                        book.photo_urls = new_urls
                        rewritten += 1

        if inserted:
            logger.info("Seeded %d books.", inserted)
        if photos_assigned:
            logger.info("Assigned photos to %d existing books.", photos_assigned)
        if rewritten:
            logger.info("Rewrote photo URLs for %d books.", rewritten)

        return inserted
