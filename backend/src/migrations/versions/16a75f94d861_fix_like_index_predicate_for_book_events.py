"""fix like index predicate for book_events

Revision ID: 16a75f94d861
Revises: 26a08a1b8970
Create Date: 2026-02-05 00:00:37.722259

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '16a75f94d861'
down_revision: Union[str, Sequence[str], None] = '26a08a1b8970'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("DROP INDEX IF EXISTS uix_book_event_like")
    op.create_index(
        "uix_book_event_like",
        "book_events",
        ["book_id", "user_id"],
        unique=True,
        postgresql_where=sa.text("interaction = 'LIKE'"),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("DROP INDEX IF EXISTS uix_book_event_like")
    op.create_index(
        "uix_book_event_like",
        "book_events",
        ["book_id", "user_id"],
        unique=True,
        postgresql_where=sa.text("interaction = 'LIKE'"),
    )
