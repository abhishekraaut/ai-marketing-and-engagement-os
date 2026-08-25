"""add YOUTUBE to platform_enum

Revision ID: 684974606013
Revises: ecb32128070d
Create Date: 2026-08-25 16:22:31.698373

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '684974606013'
down_revision = 'ecb32128070d'
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE platform_enum ADD VALUE IF NOT EXISTS 'YOUTUBE'")


def downgrade() -> None:
    pass
