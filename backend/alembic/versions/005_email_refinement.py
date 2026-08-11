"""email refinement

Revision ID: 005_email
Revises: 004_engagement
Create Date: 2026-08-11 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '005_email'
down_revision = '004_engagement'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Add APPROVED to enum
    op.execute("ALTER TYPE email_campaign_status_enum ADD VALUE IF NOT EXISTS 'APPROVED'")
    
    op.add_column('email_campaigns', sa.Column('external_campaign_id', sa.String(), nullable=True))
    op.add_column('email_campaigns', sa.Column('recipient_count', sa.Integer(), nullable=True))

def downgrade() -> None:
    op.drop_column('email_campaigns', 'recipient_count')
    op.drop_column('email_campaigns', 'external_campaign_id')
    # Note: postgres doesn't easily support dropping enum values without recreating the type
