from pydantic import BaseModel, Field
from uuid import UUID


class UserRoles(BaseModel):
    id: UUID = Field(...)
    slug: str = Field(...)
    name: str = Field(...)
    description: str | None = Field(None)


class UserRolesUpdate(BaseModel):
    roles: list[str] = Field(default_factory=list, description="Role slugs to assign")
