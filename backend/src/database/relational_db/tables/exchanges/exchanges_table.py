from uuid import UUID, uuid4
from datetime import datetime
from sqlalchemy.orm import mapped_column, Mapped, relationship
from sqlalchemy import Uuid, String, ForeignKey, Integer, DateTime
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.dialects.postgresql import ENUM

from domain.exchanges import ExchangeProgress, active_statuses
from ..table_base import Base
from ..mixins import TimestampMixin


class Exchange(TimestampMixin, Base):
    __tablename__ = "exchanges"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), default=uuid4, primary_key=True)
    book_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey('books.id', ondelete='CASCADE'), nullable=False
    )
    owner_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False
    )
    requester_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False
    )
    exchange_location_id: Mapped[int] = mapped_column(
        Integer, ForeignKey('exchange_locations.id', ondelete='CASCADE'), nullable=False
    )
    
    progress: Mapped[ExchangeProgress] = mapped_column(ENUM(ExchangeProgress), nullable=False)
    meeting_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    comment: Mapped[str | None] = mapped_column(String, nullable=True)
    cancel_reason: Mapped[str | None] = mapped_column(String, nullable=True)
    
    # confirmed_by_owner: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default=false())
    # confirmed_by_requester: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default=false())
    
    @hybrid_property
    def is_active(self) -> bool:
        return self.progress in active_statuses
    
    @is_active.expression
    def is_active(cls):
        return cls.progress.in_(active_statuses) 
        
    book: Mapped['Book'] = relationship( # type: ignore
        back_populates='exchange', lazy='selectin'
    )
    exchange_location: Mapped['ExchangeLocation'] = relationship( # type: ignore
        lazy='selectin'
    )
    owner: Mapped["User"] = relationship( # type: ignore
        "User",
        foreign_keys=[owner_id],
        lazy="selectin",
    )
    requester: Mapped["User"] = relationship( # type: ignore
        "User",
        foreign_keys=[requester_id],
        lazy="selectin",
    )
