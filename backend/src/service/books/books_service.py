import logging

from uuid import UUID, uuid4
from fastapi import UploadFile, HTTPException, status

from domain.books import ApprovalStatus
from core.storage import MediaStorage
from database.relational_db import (
    Book,
    BooksInterface,
    GenresInterface,
    User,
    UoW,
    AuthorsInterface,
    Author,
    Genre,
    BookEventsInterface,
)
from domain.books import BookCreate, BookPatch
from domain.statistics import Interaction

logger = logging.getLogger(__name__)
storage = MediaStorage()

class BookService:
    def __init__(
        self,
        uow: UoW,
        genre_repo: GenresInterface,
        books_repo: BooksInterface,
        authors_repo: AuthorsInterface,
        events_repo: BookEventsInterface,
    ):
        self.genre_repo = genre_repo
        self.books_repo = books_repo
        self.uow = uow
        self.authors_repo = authors_repo
        self.events_repo = events_repo

    async def list_genres(self):
        genres = await self.genre_repo.list_all()
        return genres
    
    async def list_authors(self):
        authors = await self.authors_repo.list_all()
        return authors

    async def _apply_user_flags(self, books: list[Book], user: User):
        ids = [b.id for b in books]
        events = await self.events_repo.list_by_user_books(ids, user.id)
        liked = {e.book_id for e in events if e.interaction == Interaction.LIKE}
        viewed = {e.book_id for e in events if e.interaction == Interaction.CLICK}
        for b in books:
            setattr(b, 'is_liked_by_user', b.id in liked)
            setattr(b, 'is_viewed_by_user', b.id in viewed)
        return books

    async def get_book(self, book_id: UUID, user: User | None = None) -> Book | None:
        book = await self.books_repo.by_id(book_id)
        if book and user is not None:
            await self._apply_user_flags([book], user)
        return book
    
    
    async def get_book_detail(self, book_id: UUID, user: User):
        """Get detailed book information with enhanced data"""
        book = await self.books_repo.with_distance(book_id, user)
        if book is None:
            raise HTTPException(404, detail='Book with this `book_id` not found')
        
        # Apply user flags
        await self._apply_user_flags([book], user)
        
        # Get statistics
        if book.stats:
            setattr(book, 'total_views', book.stats.views)
            setattr(book, 'total_likes', book.stats.likes)
            setattr(book, 'total_reserves', book.stats.reserves)
        
        return book
    
    async def get_author(self, author_id: int) -> Author | None:
        return await self.authors_repo.by_id(author_id)
    
    async def get_genre(self, genre_id: int) -> Genre | None:
        return await self.genre_repo.by_id(genre_id)

    async def create_book(self, payload: BookCreate, user: User):
        book = Book(**payload.model_dump())
        user.books.append(book)
        
        await self.uow.commit()
        
        # Refresh the book object to load all relationships
        await self.uow.session.refresh(book)
        return book
        
    async def add_photos(
        self,
        book_id: UUID,
        files: list[UploadFile],
        user: User
    ) -> Book:
        book = await self.books_repo.by_id(book_id)
        if book is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Book with this id not found")
        if book.owner_id != user.id:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "You don't own this item")

        if not storage.s3_enabled:
            await storage.clear_prefix(f"books/{book_id}")

        urls: list[str] = []
        content_type_map = {
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp",
            "image/avif": ".avif",
        }
        for f in files:
            ext = content_type_map.get(f.content_type or "")
            if ext is None:
                logger.error(f"Incorrect media type uploaded: {f.content_type}")
                raise HTTPException(
                    status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                    detail="Only jpg / png / webp / avif allowed",
                )

            name = f"{uuid4()}{ext}"

            key = f"books/{book_id}/{name}"
            url = await storage.upload_uploadfile(key, f)
            urls.append(url)

        book.photo_urls = urls
        return book

    async def list_books(
        self,
        user: User,
        limit: int,
        filter: bool = False,
        query: str | None = None,
        sort: str | None = None,
        genre: str | None = None,
        max_distance: float | None = None,
        min_rating: float | None = None,
    ):
        if filter:
            lat, lon = user.latitude, user.longitude
            books = await self.books_repo.recommended_books(
                user,
                lat,
                lon,
                limit,
                search=query,
                sort=sort,
                genre=genre,
                max_distance=max_distance,
                min_rating=min_rating,
            )
        else:
            books = await self.books_repo.list_books(
                user,
                limit,
                search=query,
                sort=sort,
                genre=genre,
                max_distance=max_distance,
                min_rating=min_rating,
            )

        await self._apply_user_flags(books, user)
        return books

    async def list_user_books(self, user: User, limit: int):
        books = await self.books_repo.list_user_books(user.id, limit)
        await self._apply_user_flags(books, user)
        return books

    async def edit_book(self, payload: BookPatch, book_id: UUID, user: User):
        data = payload.model_dump(exclude_none=True)
        
        # Not implemented yet
        # if (is_available := data.get('is_available')) is not None:
        #     if not is_available:
        #         data['unavailable_manual'] = True
        
        book = await self.get_book(book_id, user)
        if book is None:
            raise HTTPException(404, detail='Book with this id not found')
        if book.owner_id != user.id:
            raise HTTPException(403, detail='You dont have access to this resource')
        
        # # Validate is_available changes
        # if (is_available := data.get('is_available')) is not None:
        #     if is_available:
        #         # Prevent setting available if not approved
        #         if book.approval_status != ApprovalStatus.APPROVED:
        #             raise HTTPException(
        #                 status_code=400, 
        #                 detail='Cannot make book available while pending approval'
        #             )
                    
        #         # Prevent setting available if active exchange exists  
        #         if book.has_active_exchange:
        #             raise HTTPException(
        #                 status_code=400, 
        #                 detail='Cannot make book available while exchange is active'
        #             )
            
        for field, value in data.items():
            setattr(book, field, value)
            
        await self.uow.commit()
        await self.uow.session.refresh(book)
        return book
    
    async def list_books_for_approval(self, status: ApprovalStatus, limit: int):
        books = await self.books_repo.list_books_for_approval(status, limit)
        return books

    async def approve_book(self, book_id: UUID, user: User):
        book = await self.get_book(book_id, user)
        if book is None:
            raise HTTPException(404, detail='Book with this id not found')
        book.approval_status = ApprovalStatus.APPROVED
        # book.is_available = True
        return book
    
    async def reject_book(self, book_id: UUID, user: User, reason: str | None = None):
        book = await self.get_book(book_id, user)
        if book is None:
            raise HTTPException(404, detail='Book with this id not found')
        book.approval_status = ApprovalStatus.REJECTED
        if reason is not None:
            book.moderation_reason = reason
        # book.is_available = False
        return book
