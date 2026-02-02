from sqlalchemy import ForeignKey, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from ..table_base import Base


class UserRole(Base):
    __tablename__ = "user_roles"

    user_id: Mapped[Uuid] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True,
    )
    role_id: Mapped[Uuid] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True, index=True,
    )
