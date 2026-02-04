from datetime import datetime, timedelta
from uuid import UUID
from sqlalchemy import select, delete, func, case, true, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert

from domain.statistics import Interaction
from .book_events_table import BookEvent
from ..geography import ExchangeLocation
from ..users import User

class BookEventsInterface:
    def __init__(self, session: AsyncSession):
        self.session = session
        
    def add(self, book_view: BookEvent):
        self.session.add(book_view)
        
    async def record_event(
        self, 
        book_id: UUID,
        user_id: UUID, 
        interaction: Interaction
    ) -> int | None:
        stmt = (
            insert(BookEvent)
            .values(book_id=book_id, user_id=user_id, interaction=interaction)
            .on_conflict_do_nothing(
                index_elements=("book_id", "user_id"),
                index_where=text("interaction = 'LIKE'"),
            )
            .returning(BookEvent.id)
        )
        result = await self.session.execute(stmt)
        event_id = result.scalar()
        
        if event_id is None:
            del_stmt = delete(BookEvent).where(
                BookEvent.book_id == book_id,
                BookEvent.user_id == user_id,
                BookEvent.interaction == Interaction.LIKE
            )
            await self.session.execute(del_stmt)
        return event_id
        
    async def by_book_user(
        self,
        book_id: UUID,
        user_id: UUID,
        interaction: Interaction
    ) -> BookEvent | None:
        return await self.session.scalar(
            select(BookEvent)
            .where(
                BookEvent.book_id == book_id,
                BookEvent.user_id == user_id,
                BookEvent.interaction == interaction
            )
        )

    async def list_by_user_books(
        self,
        book_ids: list[UUID],
        user_id: UUID,
    ) -> list[BookEvent]:
        if not book_ids:
            return []
        events = await self.session.scalars(
            select(BookEvent).where(
                BookEvent.book_id.in_(book_ids),
                BookEvent.user_id == user_id,
            )
        )
        return list(events.all())
    
    async def users_by_day(
        self,
        days: int,
    ):
        subq = (
            select(
                func.date_trunc('day', BookEvent.created_at).label('day'),
                BookEvent.user_id,
            )
            .where(BookEvent.created_at >= datetime.now() - timedelta(days=days))
        ).subquery()

        result = await self.session.execute(
            select(
                subq.c.day.label('day'),
                func.count(func.distinct(subq.c.user_id)).label('count'),
            )
            .group_by(subq.c.day)
            .order_by(subq.c.day)
        )
        return result.mappings().all()

    async def stats_by_days(
        self,
        days: int,
        book_id: UUID | None = None,
    ):
        day = func.date_trunc('day', BookEvent.created_at)
        result = await self.session.execute(
            select(
                day.label('day'),
                func.count(
                    case(
                        (BookEvent.interaction == Interaction.CLICK, 1),
                        else_=None,
                    )
                ).label('views'),
                func.count(
                    case(
                        (BookEvent.interaction == Interaction.LIKE, 1),
                        else_=None,
                    )
                ).label('likes'),
                func.count(
                    case(
                        (BookEvent.interaction == Interaction.RESERVE, 1),
                        else_=None,
                    )
                ).label('reserves'),
            )
            .where(
                BookEvent.created_at >= datetime.now() - timedelta(days=days),
                BookEvent.book_id == book_id if book_id is not None else true(),
            )
            .group_by(day)
            .order_by(day)
        )
        return result.mappings().all()
