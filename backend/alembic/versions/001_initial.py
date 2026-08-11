"""initial

Revision ID: 001_initial
Revises: 
Create Date: 2026-08-10 23:59:59.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Users
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('email', sa.String(), unique=True, index=True),
        sa.Column('hashed_password', sa.String()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.text('now()')),
    )

    # Organizations
    op.create_table(
        'organizations',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('name', sa.String()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.text('now()')),
    )

    # Brand Profiles
    op.create_table(
        'brand_profiles',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('organization_id', sa.Integer(), sa.ForeignKey('organizations.id')),
        sa.Column('name', sa.String()),
        sa.Column('guidelines', sa.Text()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.text('now()')),
    )

    # Social Accounts
    op.create_table(
        'social_accounts',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('brand_profile_id', sa.Integer(), sa.ForeignKey('brand_profiles.id')),
        sa.Column('platform', sa.String()),
        sa.Column('account_id', sa.String()),
        sa.Column('access_token', sa.String()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.text('now()')),
    )

    # Campaigns
    op.create_table(
        'campaigns',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('organization_id', sa.Integer(), sa.ForeignKey('organizations.id')),
        sa.Column('name', sa.String()),
        sa.Column('status', sa.String()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.text('now()')),
    )

    # Content Items
    op.create_table(
        'content_items',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('campaign_id', sa.Integer(), sa.ForeignKey('campaigns.id')),
        sa.Column('base_text', sa.Text()),
        sa.Column('status', sa.String()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.text('now()')),
    )

    # Platform Variants
    op.create_table(
        'platform_variants',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('content_item_id', sa.Integer(), sa.ForeignKey('content_items.id')),
        sa.Column('platform', sa.String()),
        sa.Column('text', sa.Text()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.text('now()')),
    )

    # Schedules
    op.create_table(
        'schedules',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('platform_variant_id', sa.Integer(), sa.ForeignKey('platform_variants.id')),
        sa.Column('publish_time', sa.DateTime(timezone=True)),
        sa.Column('status', sa.String()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.text('now()')),
    )

    # Published Posts
    op.create_table(
        'published_posts',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('schedule_id', sa.Integer(), sa.ForeignKey('schedules.id')),
        sa.Column('platform_post_id', sa.String()),
        sa.Column('url', sa.String()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.text('now()')),
    )

    # Engagement Items
    op.create_table(
        'engagement_items',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('published_post_id', sa.Integer(), sa.ForeignKey('published_posts.id')),
        sa.Column('engagement_type', sa.String()),
        sa.Column('content', sa.Text()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.text('now()')),
    )

    # Email Campaigns
    op.create_table(
        'email_campaigns',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('organization_id', sa.Integer(), sa.ForeignKey('organizations.id')),
        sa.Column('subject', sa.String()),
        sa.Column('body_html', sa.Text()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.text('now()')),
    )

    # Audiences
    op.create_table(
        'audiences',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('organization_id', sa.Integer(), sa.ForeignKey('organizations.id')),
        sa.Column('name', sa.String()),
        sa.Column('criteria', sa.JSON()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.text('now()')),
    )

    # Analytics Snapshots
    op.create_table(
        'analytics_snapshots',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('organization_id', sa.Integer(), sa.ForeignKey('organizations.id')),
        sa.Column('metrics', sa.JSON()),
        sa.Column('timestamp', sa.DateTime(timezone=True)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.text('now()')),
    )

    # AI Insights
    op.create_table(
        'ai_insights',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('organization_id', sa.Integer(), sa.ForeignKey('organizations.id')),
        sa.Column('insight_text', sa.Text()),
        sa.Column('actionable', sa.Boolean(), default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.text('now()')),
    )

    # Audit Logs
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('organization_id', sa.Integer(), sa.ForeignKey('organizations.id')),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id')),
        sa.Column('action', sa.String()),
        sa.Column('details', sa.JSON()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.text('now()')),
    )

def downgrade() -> None:
    op.drop_table('audit_logs')
    op.drop_table('ai_insights')
    op.drop_table('analytics_snapshots')
    op.drop_table('audiences')
    op.drop_table('email_campaigns')
    op.drop_table('engagement_items')
    op.drop_table('published_posts')
    op.drop_table('schedules')
    op.drop_table('platform_variants')
    op.drop_table('content_items')
    op.drop_table('campaigns')
    op.drop_table('social_accounts')
    op.drop_table('brand_profiles')
    op.drop_table('organizations')
    op.drop_table('users')
