from uuid import UUID, uuid4
from sqlalchemy.orm import mapped_column, Mapped, relationship
from sqlalchemy import Uuid, String, Boolean, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import ARRAY, ENUM
from sqlalchemy.ext.hybrid import hybrid_property

from domain.books import Condition, ApprovalStatus
from ..table_base import Base
from ..mixins import TimestampMixin


class Book(TimestampMixin, Base):
    __tablename__ = "books"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), default=uuid4, primary_key=True)
    owner_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False
    )
    author_id: Mapped[int] = mapped_column(
        Integer, ForeignKey('authors.id', ondelete='CASCADE'), nullable=False
    )
    genre_id: Mapped[int]= mapped_column(
        Integer, ForeignKey('genres.id', ondelete='CASCADE'), nullable=False
    )
    exchange_location_id: Mapped[int] = mapped_column(
        Integer, ForeignKey('exchange_locations.id', ondelete='CASCADE'), nullable=False
    )
    
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=True)
    extra_terms: Mapped[str] = mapped_column(String, nullable=True)
    language_code: Mapped[str] = mapped_column(String(2), ForeignKey('languages.code'), nullable=False)
    pages: Mapped[int] = mapped_column(Integer, nullable=True)
    condition: Mapped[Condition] = mapped_column(ENUM(Condition), nullable=False)
    photo_urls: Mapped[list[str]] = mapped_column(ARRAY(String, dimensions=1), nullable=False, default=[])
    
    is_available: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    
    approval_status: Mapped[ApprovalStatus] = mapped_column(
        ENUM(ApprovalStatus), nullable=False, default=ApprovalStatus.PENDING, server_default=ApprovalStatus.PENDING.value
    )
    moderation_reason: Mapped[str] = mapped_column(String, nullable=True)
    
    @hybrid_property
    def has_active_exchange(self) -> bool:
        """Check if book has an active exchange"""
        if self.exchange is None:
            return False
        return self.exchange.is_active
        
    @has_active_exchange.expression
    def has_active_exchange(cls):
        """SQLAlchemy expression for has_active_exchange"""
        from ..exchanges import Exchange
        return cls.exchange.has(Exchange.is_active)
    
    @hybrid_property  
    def is_publicly_visible(self) -> bool:
        """Book is visible in public listings if: approved, user wants it available, and no active exchange"""
        return (
            self.approval_status == ApprovalStatus.APPROVED and
            self.is_available and  # User's preference
            not self.has_active_exchange
        )
    
    @is_publicly_visible.expression
    def is_publicly_visible(cls):
        """SQLAlchemy expression for is_publicly_visible"""
        return (
            (cls.approval_status == ApprovalStatus.APPROVED) &
            cls.is_available &
            ~cls.has_active_exchange
        )
    
    owner: Mapped['User'] = relationship(lazy='selectin') # type: ignore
    author: Mapped['Author'] = relationship(lazy='selectin') # type: ignore
    genre: Mapped['Genre'] = relationship(lazy='selectin') # type: ignore
    exchange_location: Mapped['ExchangeLocation'] = relationship(lazy='selectin') # type: ignore
    exchange: Mapped['Exchange'] = relationship( # type: ignore
        back_populates='book', uselist=False, lazy='selectin'
    )
    stats: Mapped['BookStats'] = relationship(lazy='selectin') # type: ignore
