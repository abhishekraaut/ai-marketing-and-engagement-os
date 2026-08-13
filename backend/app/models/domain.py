from sqlalchemy import Column, Integer, String, ForeignKey, Text, Boolean, DateTime, Index, UniqueConstraint, Float
from sqlalchemy.dialects.postgresql import ENUM, JSONB
from sqlalchemy.orm import relationship
from app.db.base import Base
from app.models.base import TimestampMixin
from app.models.enums import (
    PlatformEnum, SocialAccountStatusEnum, CampaignStatusEnum, ContentTypeEnum, ContentStatusEnum,
    ScheduleStatusEnum, PublishedPostStatusEnum, EngagementTypeEnum, SentimentEnum,
    EngagementCategoryEnum, ReplyStatusEnum, EmailCampaignStatusEnum, InsightTypeEnum,
    LeadSourceEnum, LeadStatusEnum
)

class BrandProfile(Base, TimestampMixin):
    __tablename__ = "brand_profiles"
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    products = Column(JSONB)
    target_audience = Column(JSONB)
    tone = Column(String)
    approved_messaging = Column(JSONB)
    prohibited_words = Column(JSONB)
    prohibited_claims = Column(JSONB)
    guidelines = Column(Text)

    organization = relationship("Organization", back_populates="brand_profiles")

class SocialAccount(Base, TimestampMixin):
    __tablename__ = "social_accounts"
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    platform = Column(ENUM(PlatformEnum, name="platform_enum", create_type=False), nullable=False)
    external_account_id = Column(String, nullable=False)
    account_name = Column(String)
    access_token_encrypted = Column(String)
    refresh_token_encrypted = Column(String)
    token_expires_at = Column(DateTime(timezone=True))
    status = Column(ENUM(SocialAccountStatusEnum, name="social_account_status_enum", create_type=False), nullable=False)
    metadata_ = Column("metadata", JSONB)

    organization = relationship("Organization", back_populates="social_accounts")
    published_posts = relationship("PublishedPost", back_populates="social_account")
    engagement_items = relationship("EngagementItem", back_populates="social_account")

    __table_args__ = (
        UniqueConstraint("organization_id", "platform", "external_account_id", name="uq_social_account"),
    )

class Campaign(Base, TimestampMixin):
    __tablename__ = "campaigns"
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    objective = Column(String)
    topic = Column(String)
    target_audience = Column(JSONB)
    tone = Column(String)
    cta = Column(String)
    status = Column(ENUM(CampaignStatusEnum, name="campaign_status_enum", create_type=False), nullable=False)
    start_date = Column(DateTime(timezone=True))
    end_date = Column(DateTime(timezone=True))
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))

    organization = relationship("Organization", back_populates="campaigns")
    content_items = relationship("ContentItem", back_populates="campaign", cascade="all, delete-orphan")
    email_campaigns = relationship("EmailCampaign", back_populates="campaign", cascade="all, delete-orphan")
    analytics_snapshots = relationship("AnalyticsSnapshot", back_populates="campaign")
    ai_insights = relationship("AIInsight", back_populates="campaign")

    __table_args__ = (
        Index("ix_campaigns_org_status", "organization_id", "status"),
    )

class ContentItem(Base, TimestampMixin):
    __tablename__ = "content_items"
    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False)
    content_type = Column(ENUM(ContentTypeEnum, name="content_type_enum", create_type=False), nullable=False)
    title = Column(String)
    base_content = Column(Text)
    status = Column(ENUM(ContentStatusEnum, name="content_status_enum", create_type=False), nullable=False)
    ai_score = Column(Float)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))

    campaign = relationship("Campaign", back_populates="content_items")
    platform_variants = relationship("PlatformVariant", back_populates="content_item", cascade="all, delete-orphan")

class PlatformVariant(Base, TimestampMixin):
    __tablename__ = "platform_variants"
    id = Column(Integer, primary_key=True, index=True)
    content_item_id = Column(Integer, ForeignKey("content_items.id", ondelete="CASCADE"), nullable=False)
    platform = Column(ENUM(PlatformEnum, name="platform_enum", create_type=False), nullable=False)
    content = Column(Text)
    caption = Column(Text)
    cta = Column(String)
    hashtags = Column(JSONB)
    media_urls = Column(JSONB)
    ai_score = Column(Float)
    status = Column(ENUM(ContentStatusEnum, name="content_status_enum", create_type=False), nullable=False)

    content_item = relationship("ContentItem", back_populates="platform_variants")
    schedules = relationship("Schedule", back_populates="platform_variant", cascade="all, delete-orphan")

class Schedule(Base, TimestampMixin):
    __tablename__ = "schedules"
    id = Column(Integer, primary_key=True, index=True)
    platform_variant_id = Column(Integer, ForeignKey("platform_variants.id", ondelete="CASCADE"), nullable=False)
    scheduled_at = Column(DateTime(timezone=True))
    timezone = Column(String)
    status = Column(ENUM(ScheduleStatusEnum, name="schedule_status_enum", create_type=False), nullable=False)

    platform_variant = relationship("PlatformVariant", back_populates="schedules")
    published_posts = relationship("PublishedPost", back_populates="schedule", cascade="all, delete-orphan")

class PublishedPost(Base, TimestampMixin):
    __tablename__ = "published_posts"
    id = Column(Integer, primary_key=True, index=True)
    platform_variant_id = Column(Integer, ForeignKey("platform_variants.id", ondelete="SET NULL"))
    schedule_id = Column(Integer, ForeignKey("schedules.id", ondelete="SET NULL"))
    social_account_id = Column(Integer, ForeignKey("social_accounts.id", ondelete="CASCADE"), nullable=False)
    external_post_id = Column(String, index=True)
    published_at = Column(DateTime(timezone=True))
    url = Column(String)
    status = Column(ENUM(PublishedPostStatusEnum, name="published_post_status_enum", create_type=False), nullable=False)
    metadata_ = Column("metadata", JSONB)

    schedule = relationship("Schedule", back_populates="published_posts")
    social_account = relationship("SocialAccount", back_populates="published_posts")
    engagement_items = relationship("EngagementItem", back_populates="published_post")
    analytics_snapshots = relationship("AnalyticsSnapshot", back_populates="published_post")

class EngagementItem(Base, TimestampMixin):
    __tablename__ = "engagement_items"
    id = Column(Integer, primary_key=True, index=True)
    published_post_id = Column(Integer, ForeignKey("published_posts.id", ondelete="CASCADE"), nullable=False)
    social_account_id = Column(Integer, ForeignKey("social_accounts.id", ondelete="CASCADE"), nullable=False)
    external_id = Column(String)
    type = Column(ENUM(EngagementTypeEnum, name="engagement_type_enum", create_type=False), nullable=False)
    author_name = Column(String)
    author_external_id = Column(String)
    content = Column(Text)
    sentiment = Column(ENUM(SentimentEnum, name="sentiment_enum", create_type=False))
    category = Column(ENUM(EngagementCategoryEnum, name="engagement_category_enum", create_type=False))
    ai_generated_reply = Column(Text)
    human_reply = Column(Text)
    external_reply_id = Column(String)
    reply_status = Column(ENUM(ReplyStatusEnum, name="reply_status_enum", create_type=False), index=True)

    published_post = relationship("PublishedPost", back_populates="engagement_items")
    social_account = relationship("SocialAccount", back_populates="engagement_items")

class Audience(Base, TimestampMixin):
    __tablename__ = "audiences"
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    criteria = Column(JSONB)
    contact_count = Column(Integer)

    organization = relationship("Organization", back_populates="audiences")
    email_campaigns = relationship("EmailCampaign", back_populates="audience")

class Lead(Base, TimestampMixin):
    __tablename__ = "leads"
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    email = Column(String)
    phone = Column(String)
    source = Column(ENUM(LeadSourceEnum, name="lead_source_enum", create_type=False), nullable=False)
    status = Column(ENUM(LeadStatusEnum, name="lead_status_enum", create_type=False), nullable=False)
    conversion_time_hours = Column(Float)
    notes = Column(Text)

    organization = relationship("Organization", back_populates="leads")

class EmailCampaign(Base, TimestampMixin):
    __tablename__ = "email_campaigns"
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    campaign_id = Column(Integer, ForeignKey("campaigns.id", ondelete="SET NULL"))
    audience_id = Column(Integer, ForeignKey("audiences.id", ondelete="SET NULL"))
    name = Column(String, nullable=False)
    subject = Column(String)
    preview_text = Column(String)
    body = Column(Text)
    cta = Column(String)
    status = Column(ENUM(EmailCampaignStatusEnum, name="email_campaign_status_enum", create_type=False), nullable=False)
    scheduled_at = Column(DateTime(timezone=True))
    sent_at = Column(DateTime(timezone=True))
    recipient_count = Column(Integer, default=0)
    external_campaign_id = Column(String)

    organization = relationship("Organization", back_populates="email_campaigns")
    campaign = relationship("Campaign", back_populates="email_campaigns")
    audience = relationship("Audience", back_populates="email_campaigns")

class AnalyticsSnapshot(Base, TimestampMixin):
    __tablename__ = "analytics_snapshots"
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    campaign_id = Column(Integer, ForeignKey("campaigns.id", ondelete="CASCADE"))
    published_post_id = Column(Integer, ForeignKey("published_posts.id", ondelete="CASCADE"))
    platform = Column(ENUM(PlatformEnum, name="platform_enum", create_type=False))
    snapshot_date = Column(DateTime(timezone=True), nullable=False)
    impressions = Column(Integer, default=0)
    reach = Column(Integer, default=0)
    likes = Column(Integer, default=0)
    comments = Column(Integer, default=0)
    shares = Column(Integer, default=0)
    clicks = Column(Integer, default=0)
    url_clicks = Column(Integer, default=0)
    followers = Column(Integer, default=0)
    engagement_rate = Column(Float, default=0.0)
    metadata_ = Column("metadata", JSONB)

    organization = relationship("Organization", back_populates="analytics_snapshots")
    campaign = relationship("Campaign", back_populates="analytics_snapshots")
    published_post = relationship("PublishedPost", back_populates="analytics_snapshots")

    __table_args__ = (
        Index("ix_analytics_platform_date", "platform", "snapshot_date"),
    )

class AIInsight(Base, TimestampMixin):
    __tablename__ = "ai_insights"
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    campaign_id = Column(Integer, ForeignKey("campaigns.id", ondelete="CASCADE"))
    type = Column(ENUM(InsightTypeEnum, name="insight_type_enum", create_type=False), nullable=False)
    title = Column(String)
    summary = Column(Text)
    recommendation = Column(Text)
    confidence = Column(Float)
    metadata_ = Column("metadata", JSONB)

    organization = relationship("Organization", back_populates="ai_insights")
    campaign = relationship("Campaign", back_populates="ai_insights")

class AuditLog(Base, TimestampMixin):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    action = Column(String, nullable=False)
    entity_type = Column(String)
    entity_id = Column(String)
    metadata_ = Column("metadata", JSONB)

    organization = relationship("Organization", back_populates="audit_logs")
    user = relationship("User", back_populates="audit_logs")

    __table_args__ = (
        Index("ix_audit_org_created_at", "organization_id", "created_at"),
    )
