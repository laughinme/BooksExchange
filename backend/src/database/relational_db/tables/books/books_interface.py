from uuid import UUID
from sqlalchemy import select, func, or_, case
from sqlalchemy.ext.asyncio import AsyncSession

from domain.books import ApprovalStatus
from utils import dist_expression
from .books_table import Book
from .authors_table import Author
from .genres_table import Genre
from ..recommendations import UserInterest
from ..statistics import BookStats
from ..geography import ExchangeLocation
from ..users import User


class BooksInterface:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def by_id(self, id: UUID) -> Book | None:
        book = await self.session.scalar(
            select(Book)
            .where(Book.id == id)
        )
        
        return book
    
    async def with_distance(self, book_id: UUID, user: User) -> Book:
        if user.latitude is not None and user.longitude is not None:
            stmt = (
                select(Book, dist_expression(ExchangeLocation, user.latitude, user.longitude).label('distance'))
                .join(ExchangeLocation)
                .where(Book.id == book_id)
            )
            result = await self.session.execute(stmt)
            book, distance = result.first()
            setattr(book, 'distance', round(distance, 2))
        else:
            stmt = (
                select(Book)
                .where(Book.id == book_id)
            )
            book = await self.session.scalar(stmt)
            setattr(book, 'distance', None)
            
        return book
    
    def add(self, book: Book):
        self.session.add(book)

    async def check_ownership(self, book_id: UUID, user_id: UUID) -> Book | None:
        book = await self.session.scalar(
            select(Book)
            .where(Book.id == book_id, Book.owner_id == user_id)
        )
        
        return book    
    
    async def recommended_books(
        self,
        user: User,
        lat: float | None,
        lon: float | None,
        limit: int,
        search: str | None = None,
        sort: str | None = None,
        genre: str | None = None,
        max_distance: float | None = None,
        min_rating: float | None = None,
    ) -> list[Book]:
        w_geo, w_pop, w_rec, w_int, w_lang = 0.2, 2.0, 1.2, 2.8, 0.5
        fresh_period = 3
        score = 0

        distance_expr = None
        if lat is not None and lon is not None:
            distance_expr = dist_expression(ExchangeLocation, lat, lon)
            geo_score = func.least(1 / (1 + distance_expr), 1)
            score += w_geo * geo_score

        views = func.coalesce(BookStats.views, 0)
        likes = func.coalesce(BookStats.likes, 0)
        reserves = func.coalesce(BookStats.reserves, 0)
        popularity_score = func.log(1 + views + likes * 3 + reserves * 4)
        recent_score = func.exp(
            -(func.extract("epoch", func.now() - Book.created_at) / 86400) / fresh_period
        )
        interest_score = func.least(func.coalesce(UserInterest.coef, 0), 30)

        score += w_pop * popularity_score + w_rec * recent_score + w_int * interest_score

        city_match_expr = None
        if user.city_id is not None:
            city_match_expr = case(
                (ExchangeLocation.city_id == user.city_id, 1),
                else_=0,
            )

        if user.language_code is not None:
            lang_score = case(
                (Book.language_code == user.language_code, 1),
                else_=0,
            )
            score += w_lang * lang_score

        stmt = (
            select(Book)
            .join(ExchangeLocation)
            .join(Author)
            .join(Genre)
            .outerjoin(BookStats, Book.id == BookStats.book_id)
            .outerjoin(
                UserInterest,
                (UserInterest.user_id == user.id) & (UserInterest.genre_id == Book.genre_id)
            )
            .where(
                or_(
                    Book.is_publicly_visible,
                    Book.owner_id == user.id,
                )
            )
        )
        if search:
            pattern = f"%{search}%"
            stmt = stmt.where(
                Book.title.ilike(pattern)
                | Author.name.ilike(pattern)
                | Genre.name.ilike(pattern)
            )
        if genre:
            if genre.isdigit():
                stmt = stmt.where(Book.genre_id == int(genre))
            else:
                stmt = stmt.where(Genre.name.ilike(f"%{genre}%"))
        if distance_expr is not None and max_distance is not None:
            stmt = stmt.where(distance_expr <= max_distance)

        rating_expr = func.least(likes / 10.0, 5.0)
        if min_rating is not None:
            stmt = stmt.where(rating_expr >= min_rating)

        # Sorting
        if sort == "distance" and distance_expr is not None:
            stmt = stmt.order_by(distance_expr.asc(), Book.created_at.desc())
        elif sort == "rating":
            stmt = stmt.order_by(rating_expr.desc(), Book.created_at.desc())
        elif sort == "newest":
            stmt = stmt.order_by(Book.created_at.desc())
        else:
            if city_match_expr is not None:
                stmt = stmt.order_by(city_match_expr.desc(), score.desc())
            else:
                stmt = stmt.order_by(score.desc())

        stmt = stmt.limit(limit)

        books = await self.session.scalars(stmt)

        return list(books.all())
    
    async def list_books(
        self,
        user: User,
        limit: int,
        search: str | None = None,
        sort: str | None = None,
        genre: str | None = None,
        max_distance: float | None = None,
        min_rating: float | None = None,
    ) -> list[Book]:
        lat = user.latitude
        lon = user.longitude
        distance_expr = dist_expression(ExchangeLocation, lat, lon) if lat is not None and lon is not None else None
        rating_expr = func.least(func.coalesce(BookStats.likes, 0) / 10.0, 5.0)

        stmt = (
            select(Book)
            .join(ExchangeLocation)
            .join(Author)
            .join(Genre)
            .outerjoin(BookStats, Book.id == BookStats.book_id)
            .where(Book.is_publicly_visible)
        )

        if search:
            pattern = f"%{search}%"
            stmt = stmt.where(
                Book.title.ilike(pattern)
                | Author.name.ilike(pattern)
                | Genre.name.ilike(pattern)
            )
        if genre:
            if genre.isdigit():
                stmt = stmt.where(Book.genre_id == int(genre))
            else:
                stmt = stmt.where(Genre.name.ilike(f"%{genre}%"))

        if distance_expr is not None and max_distance is not None:
            stmt = stmt.where(distance_expr <= max_distance)
        if min_rating is not None:
            stmt = stmt.where(rating_expr >= min_rating)

        if sort == "distance" and distance_expr is not None:
            stmt = stmt.order_by(distance_expr.asc(), Book.created_at.desc())
        elif sort == "rating":
            stmt = stmt.order_by(rating_expr.desc(), Book.created_at.desc())
        else:
            stmt = stmt.order_by(Book.created_at.desc())

        stmt = stmt.limit(limit)

        books = await self.session.scalars(stmt)
        return list(books.all())

    async def list_user_books(self, user_id: UUID, limit: int) -> list[Book]:
        books = await self.session.scalars(
            select(Book)
            .where(Book.owner_id == user_id)
            .limit(limit)
        )
        return list(books.all())

    async def list_books_for_approval(self, status: ApprovalStatus, limit: int) -> list[Book]:
        books = await self.session.scalars(
            select(Book)
            .where(Book.approval_status == status)
            .limit(limit)
        )
        return list(books.all())
