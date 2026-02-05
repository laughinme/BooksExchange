import logging

from uuid import UUID
from datetime import datetime
from fastapi import HTTPException

from core.config import Settings, is_debug_mode
from database.relational_db import (
    UoW,
    BooksInterface,
    User,
    ExchangesInterface,
    Exchange,
    Book,
)
from domain.exchanges import ExchangeCreate, ExchangeProgress, ExchangeCancel, ExchangeEdit
from .exceptions import IncorrectStatusError, IncorrectNewlyError

settings = Settings() # type: ignore
logger = logging.getLogger(__name__)

class ExchangeService:
    def __init__(
        self,
        uow: UoW,
        books_repo: BooksInterface,
        ex_repo: ExchangesInterface,
        
    ):
        self.uow = uow
        self.books_repo = books_repo
        self.ex_repo = ex_repo
        
    async def _ensure_book(self, book_id: UUID) -> Book:
        book = await self.books_repo.by_id(book_id)
        if book is None:
            raise HTTPException(404, detail='Book with this `book_id` not found.')
        return book
    
    async def _ensure_exchange(self, exchange_id: UUID) -> Exchange:
        exchange = await self.ex_repo.by_id(exchange_id)
        if exchange is None:
            raise HTTPException(404, detail='Exchange with this `exchange_id` not found.')
        return exchange
        
    async def request_exchange(self, book_id: UUID, user: User, payload: ExchangeCreate):
        book = await self._ensure_book(book_id)
        if book.owner_id == user.id:
            raise HTTPException(400, detail="You can't reserve your own book")
        
        existing_exchange = await self.ex_repo.by_book_for_requester(book_id, user.id)
        if existing_exchange is not None:
            raise HTTPException(400, detail='You cant make more than one request for a single book')
        
        exchange = Exchange(
            book_id=book_id,
            owner_id=book.owner_id,
            requester_id=user.id,
            exchange_location_id=book.exchange_location_id,
            progress=ExchangeProgress.CREATED,
            meeting_time=payload.meeting_time,
            comment=payload.comment,
        )
        self.ex_repo.add(exchange)
        await self.uow.commit()
        
        await self.uow.session.refresh(
            exchange, 
            ['book', 'exchange_location', 'owner', 'requester']
        )
        return exchange
    
    async def list_all(
        self, 
        only_active: bool = True, 
        limit: int = 50,
    ):
        exchanges = await self.ex_repo.list_all(only_active, limit)
        return exchanges

    async def admin_list_exchanges(
        self,
        *,
        status: ExchangeProgress | None = None,
        limit: int = 50,
        cursor: str | None = None,
    ) -> tuple[list[Exchange], str | None]:
        cursor_created_at: datetime | None = None
        cursor_id: UUID | None = None
        if cursor:
            try:
                ts_str, id_str = cursor.split("_", 1)
                cursor_created_at = datetime.fromisoformat(ts_str)
                cursor_id = UUID(id_str)
            except Exception:
                raise HTTPException(400, detail='Invalid cursor')

        exchanges = await self.ex_repo.admin_list_exchanges(
            progress=status,
            only_active=True if status is None else None,
            limit=limit,
            cursor_created_at=cursor_created_at,
            cursor_id=cursor_id,
        )

        next_cursor = None
        if len(exchanges) == limit:
            last = exchanges[-1]
            if last.created_at is not None:
                next_cursor = f"{last.created_at.isoformat()}_{last.id}"

        return exchanges, next_cursor
    
    async def list_requested(
        self, 
        user: User, 
        only_active: bool = True, 
        limit: int = 50
    ):
        exchanges = await self.ex_repo.by_requester(user.id, only_active, limit)
        return exchanges

    async def list_owned(
        self, 
        user: User, 
        only_active: bool = True, 
        limit: int = 50
    ):
        exchanges = await self.ex_repo.by_owner(user.id, only_active, limit)
        return exchanges

    async def get_exchange(self, exchange_id: UUID, user: User):
        exchange = await self._ensure_exchange(exchange_id)
        if not(exchange.owner_id == user.id or exchange.requester_id == user.id):
            raise HTTPException(403, detail='You dont have access to this resource')
        
        return exchange
    
    async def accept_exchange(
        self,
        exchange_id: UUID,
        user: User,
    ):
        exchange = await self._ensure_exchange(exchange_id)
        if exchange.owner_id != user.id:
            raise HTTPException(403, detail='You dont have access to this resource')
        if exchange.book.has_active_exchange:
            raise HTTPException(400, detail='You cant accept more than one exchange request for the same book')
        if exchange.progress != ExchangeProgress.CREATED:
            raise IncorrectNewlyError
        
        exchange.progress = ExchangeProgress.ACCEPTED
        # Book will automatically become not publicly visible due to active exchange
        # exchange.book.is_available = False
        
        return exchange
        
    async def decline_exchange(
        self,
        exchange_id: UUID,
        user: User,
        payload: ExchangeCancel,
    ):
        exchange = await self._ensure_exchange(exchange_id)
        if exchange.owner_id != user.id:
            raise HTTPException(403, detail='You dont have access to this resource')
        if exchange.progress != ExchangeProgress.CREATED:
            raise IncorrectNewlyError
        
        exchange.progress = ExchangeProgress.DECLINED
        if payload is not None:
            exchange.cancel_reason = payload.cancel_reason
                
        return exchange
    
    async def cancel_exchange(
        self, 
        exchange_id: UUID,
        user: User,
        payload: ExchangeCancel,
    ):
        exchange = await self._ensure_exchange(exchange_id)
        
        if exchange.owner_id == user.id:
            if exchange.progress != ExchangeProgress.ACCEPTED:
                raise IncorrectStatusError
        elif exchange.requester_id == user.id:
            if exchange.progress not in (ExchangeProgress.ACCEPTED, ExchangeProgress.CREATED):
                raise HTTPException(
                    status_code=400,
                    detail='You can perform this with only newly created or accepted exchange requests'
                )
        else:
            raise HTTPException(403, detail='You dont have access to this resource')
        
        exchange.cancel_reason = payload.cancel_reason
        exchange.progress = ExchangeProgress.CANCELED
        # Book will automatically become publicly visible again if user wants it available
        # exchange.book.is_available = True
        
        return exchange
    
    async def confirm_exchange(
        self,
        exchange_id: UUID,
        user: User,
    ):
        exchange = await self._ensure_exchange(exchange_id)
        if not(exchange.owner_id == user.id or exchange.requester_id == user.id):
            raise HTTPException(403, detail='You dont have access to this resource')
        if exchange.progress != ExchangeProgress.ACCEPTED:
            raise IncorrectStatusError
        
        exchange.progress = ExchangeProgress.FINISHED
        # Exchange is finished, book remains not publicly visible due to finished exchange
        # exchange.book.is_available = False
        
        return exchange

    async def admin_get_exchange(self, exchange_id: UUID) -> Exchange:
        return await self._ensure_exchange(exchange_id)

    async def admin_force_finish(self, exchange_id: UUID) -> Exchange:
        if is_debug_mode(settings):
            raise HTTPException(403, detail="Admin exchange moderation is disabled in DEBUG mode")
        exchange = await self._ensure_exchange(exchange_id)
        # Only allow finishing if there is no other finished exchange for the same book
        has_other_finished = await self.ex_repo.exists_finished_for_book(exchange.book_id, exclude_id=exchange.id)
        if has_other_finished:
            raise HTTPException(400, detail='Book already has another finished exchange')
        exchange.progress = ExchangeProgress.FINISHED
        return exchange

    async def admin_force_cancel(self, exchange_id: UUID) -> Exchange:
        if is_debug_mode(settings):
            raise HTTPException(403, detail="Admin exchange moderation is disabled in DEBUG mode")
        exchange = await self._ensure_exchange(exchange_id)
        exchange.progress = ExchangeProgress.CANCELED
        return exchange

    async def update_exchange(
        self,
        exchange_id: UUID,
        user: User,
        payload: ExchangeEdit,
    ):
        exchange = await self._ensure_exchange(exchange_id)
        if not(exchange.owner_id == user.id or exchange.requester_id == user.id):
            raise HTTPException(403, detail='You dont have access to this resource')
        
        data = payload.model_dump(exclude_none=True)
        
        for name, value in data.items():
            setattr(exchange, name, value)
        
        return exchange
