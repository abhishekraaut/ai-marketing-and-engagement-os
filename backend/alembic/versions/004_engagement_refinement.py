"""engagement refinement

Revision ID: 004_engagement
Revises: 003_analytics
Create Date: 2026-08-11 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '004_engagement'
down_revision = '003_analytics'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.add_column('engagement_items', sa.Column('human_reply', sa.Text(), nullable=True))
    op.add_column('engagement_items', sa.Column('external_reply_id', sa.String(), nullable=True))

    op.create_index(op.f('ix_engagement_items_reply_status'), 'engagement_items', ['reply_status'], unique=False)
    op.create_index(op.f('ix_engagement_items_sentiment'), 'engagement_items', ['sentiment'], unique=False)
    op.create_index(op.f('ix_engagement_items_category'), 'engagement_items', ['category'], unique=False)

def downgrade() -> None:
    op.drop_index(op.f('ix_engagement_items_category'), table_name='engagement_items')
    op.drop_index(op.f('ix_engagement_items_sentiment'), table_name='engagement_items')
    op.drop_index(op.f('ix_engagement_items_reply_status'), table_name='engagement_items')
    op.drop_column('engagement_items', 'external_reply_id')
    op.drop_column('engagement_items', 'human_reply')
