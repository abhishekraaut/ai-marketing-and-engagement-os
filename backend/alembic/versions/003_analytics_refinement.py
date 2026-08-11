"""analytics refinement

Revision ID: 003_analytics
Revises: 002_domain_model_refinement
Create Date: 2026-08-11 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '003_analytics'
down_revision = '002_domain_model_refinement'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # We add a unique constraint to ensure analytics syncs don't duplicate snapshots per day
    # We must first ensure we cast snapshot_date to DATE if we want daily uniqueness, 
    # but the simplest robust way is just logical handling in code since exact times might vary.
    # However, to be strict, we can add a constraint on (published_post_id, snapshot_date).
    # Postgres allows this if the timezone date is exact, but usually analytics date truncates.
    # We will enforce this via code to avoid complex DB Date casting issues in this prototype,
    # but we can add the constraint here for architecture demonstration.
    op.create_unique_constraint('uq_analytics_post_date', 'analytics_snapshots', ['published_post_id', 'snapshot_date'])

def downgrade() -> None:
    op.drop_constraint('uq_analytics_post_date', 'analytics_snapshots', type_='unique')
