from uuid import UUID
from typing import Annotated
from pydantic import BaseModel, Field, constr

from domain.common import TimestampModel
from .authors import AuthorModel
from .genres import GenreModel
from ..enums import Condition, ApprovalStatus
from ...geo import ExchangeLocation
from ...users.schemas.shareable import UserBrief

class BookModel(TimestampModel, BaseModel):
    id: UUID = Field(...)
    owner: UserBrief = Field(..., description="Book owner's brief profile")

    title: str = Field(...)
    description: str | None = Field(None)
    extra_terms: str | None = Field(None)

    author: AuthorModel = Field(...)
    genre: GenreModel = Field(...)
    language_code: str = Field(..., min_length=2, max_length=2)
    pages: int | None = Field(None)
    condition: Condition = Field(...)
    photo_urls: list[str] = Field(...)

    exchange_location: ExchangeLocation = Field(...)
    
    is_available: bool = Field(...)
    approval_status: ApprovalStatus = Field(..., description='Status of book approval by admin')
    moderation_reason: str | None = Field(None, description='Reason of book rejection by admin')
    
    is_liked_by_user: bool = Field(False)
    is_viewed_by_user: bool = Field(False)
    total_views: int = Field(0)
    total_likes: int = Field(0)
    total_reserves: int = Field(0)


class BookDetailModel(BookModel):
    """Enhanced book model for detailed view with additional data"""
    # Statistics
    total_views: int = Field(0, description="Total number of views")
    total_likes: int = Field(0, description="Total number of likes")
    total_reserves: int = Field(0, description="Total number of reserves")
    
    # Location data
    distance: float | None = Field(None, description="Distance from current user in kilometers")
    
    # Exchange status
    has_active_exchange: bool = Field(False, description="Whether book has an active exchange")


class BookCreate(BaseModel):
    title: str = Field(...)
    description: str | None = Field(None)
    extra_terms: str | None = Field(None)

    author_id: int = Field(...)
    genre_id: int = Field(...)
    language_code: str = Field(..., min_length=2, max_length=2)
    pages: int | None = Field(None)
    condition: Condition = Field(...)

    exchange_location_id: int = Field(...)
    is_available: bool = Field(True)


class BookPatch(BookCreate):
    title: str | None = Field(None)
    author_id: int | None = Field(None)
    genre_id: int | None = Field(None)
    language_code: Annotated[str, constr(min_length=2, max_length=2)] | None = Field(None)
    condition: Condition | None = Field(None)
    exchange_location_id: int | None = Field(None)
    is_available: bool | None = Field(None)
