"""seed roles

Revision ID: 26a08a1b8970
Revises: 50930768897b
Create Date: 2026-02-02 16:41:24.774443

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from uuid import uuid4


# revision identifiers, used by Alembic.
revision: str = '26a08a1b8970'
down_revision: Union[str, Sequence[str], None] = '50930768897b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # conn = op.get_bind()
    
    roles_table = sa.table(
        "roles",
        sa.column("id", sa.Uuid()),
        sa.column("slug", sa.String()),
        sa.column("name", sa.String()),
        sa.column("description", sa.Text()),
        sa.column("created_at", sa.DateTime(timezone=True)),
    )
    
    admin_role_id = uuid4()
    member_role_id = uuid4()
    
    op.bulk_insert(
        roles_table,
        [
            {
                "id": admin_role_id,
                "slug": "admin",
                "name": "Administrator",
                "description": "Full administrative access",
            },
            {
                "id": member_role_id,
                "slug": "member",
                "name": "Member",
                "description": "Default role for registered users",
            },
        ],
    )


def downgrade() -> None:
    """Downgrade schema."""
    
    roles_table = sa.table(
        "roles",
        sa.column("id", sa.Uuid()),
        sa.column("slug", sa.String()),
        sa.column("name", sa.String()),
        sa.column("description", sa.Text()),
        sa.column("created_at", sa.DateTime(timezone=True)),
    )
    
    op.execute(
        roles_table.delete().where(roles_table.c.slug.in_(["admin", "member"]))
    )
