from pydantic import BaseModel, Field
from uuid import UUID


class RoleModel(BaseModel):
    id: UUID = Field(...)
    slug: str = Field(...)
    name: str = Field(...)
    description: str | None = Field(None)

