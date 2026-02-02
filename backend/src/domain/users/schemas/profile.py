from typing import Annotated
from pydantic import BaseModel, Field, EmailStr, confloat, model_validator, HttpUrl, field_validator, constr
from datetime import date
from uuid import UUID

from domain.common import TimestampModel
from domain.books.schemas import GenreModel
from ..enums import Gender
from ...geo import CityModel

class UserModel(TimestampModel):
    """User account representation."""
    id: UUID = Field(...)
    email: EmailStr = Field(..., description="User e-mail")
    
    username: str | None = Field(None, description="User's display name")
    avatar_url: HttpUrl | None = Field(None)
    bio: str | None = Field(None)
    birth_date: date | None = Field(None)
    age: int | None = Field(None)
    gender: Gender | None = Field(None)
    language_code: Annotated[str, constr(min_length=2, max_length=2)] | None = Field(None)
    
    favorite_genres: list[GenreModel] = Field(...)
    
    city: CityModel | None = Field(None)
    
    latitude: Annotated[float, confloat(ge=-90, le=90)] | None = Field(None)
    longitude: Annotated[float, confloat(ge=-90, le=90)] | None = Field(None)
    
    is_onboarded: bool
    banned: bool
    public: bool = Field(..., description='Whether user wants his profile to be visible to others')
    
    roles: list[str] = Field(
        alias="role_slugs",
        default_factory=list,
        description="User's roles."
    )


class UserPatch(BaseModel):
    username: str | None = Field(None, description="User's display name")
    avatar_url: str | None = Field(None)
    bio: str | None = Field(None)
    birth_date: date | None = Field(None)
    gender: Gender | None = Field(None)
    language_code: Annotated[str, constr(min_length=2, max_length=2)] | None = Field(None)
    
    city_id: int | None = Field(None)
    
    favorite_genres: set[int] | None = Field(
        None, 
        description='По многочисленным просьбам михлапа я добавил жанры в patch. '\
                    'После того как жанры были установлены, их нельзя поменять на новые.'
    )
    
    latitude: Annotated[float, confloat(ge=-90, le=90)] | None = Field(None)
    longitude: Annotated[float, confloat(ge=-180, le=180)] | None = Field(None)
    
    public: bool | None = Field(None, description='Whether user wants his profile to be visible to others')

    @model_validator(mode='after')
    def _coords_integrity(self):
        if (self.latitude is None) ^ (self.longitude is None):
            raise ValueError('Both coordinates must be passed')
        return self


class GenresPatch(BaseModel):
    favorite_genres: set[int] = Field(
        ..., description='List of genre ids', min_length=1
    )
    
    @field_validator('favorite_genres')
    @classmethod
    def _genres(cls, v):
        if v is not None and len(set(v)) != len(v):
            raise ValueError('Ids in favorite_genres must be unique')
        return v
