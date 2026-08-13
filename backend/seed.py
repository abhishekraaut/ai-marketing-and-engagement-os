import os
import sys
import datetime
from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine
from app.core.security import get_password_hash
from app.models.user import User, Organization, OrganizationMember
from app.models.domain import (
    BrandProfile, SocialAccount, Campaign, ContentItem, PlatformVariant,
    Schedule, PublishedPost, AnalyticsSnapshot, EngagementItem, Audience, 
    EmailCampaign, AIInsight, AuditLog
)
from app.models.enums import *

def seed_data(db: Session):
    org_slug = "ai-saas-inc"
    user_email = "founder@aisaastas.com"
    
    # Check if org exists
    org = db.query(Organization).filter_by(slug=org_slug).first()
    if org:
        print("Database is already seeded. Skipping.")
        return


    hashed_pw = get_password_hash("password123")

    user_owner = User(email="founder@aisaastas.com", name="Alice Founder", hashed_password=hashed_pw, is_active=True)
    user_admin = User(email="admin@aisaastas.com", name="Bob Admin", hashed_password=hashed_pw, is_active=True)
    user_member = User(email="member@aisaastas.com", name="Charlie Member", hashed_password=hashed_pw, is_active=True)
    
    db.add_all([user_owner, user_admin, user_member])
    db.commit()

    org = Organization(name="AI SaaS Inc.", slug="ai-saas-inc")
    db.add(org)
    db.commit()
    
    m1 = OrganizationMember(organization_id=org.id, user_id=user_owner.id, role=RoleEnum.OWNER)
    m2 = OrganizationMember(organization_id=org.id, user_id=user_admin.id, role=RoleEnum.ADMIN)
    m3 = OrganizationMember(organization_id=org.id, user_id=user_member.id, role=RoleEnum.EDITOR)
    db.add_all([m1, m2, m3])
    db.commit()
    
    # Use user_owner for created_by in seed
    user1 = user_owner

    bp = BrandProfile(
        organization_id=org.id,
        name="AI SaaS Brand",
        description="B2B AI Platform for marketing teams.",
        products=["AI Copywriter", "Analytics Agent"],
        target_audience=["CMOs", "Marketing Managers"],
        tone="Professional, innovative, confident",
    )
    db.add(bp)
    db.commit()

    platforms = [
        (PlatformEnum.LINKEDIN, "li_12345", "AI SaaS LinkedIn"),
        (PlatformEnum.X, "x_98765", "@aisaastas"),
        (PlatformEnum.INSTAGRAM, "ig_111", "aisaastas_ig"),
        (PlatformEnum.FACEBOOK, "fb_222", "AI SaaS FB Page")
    ]
    accounts = {}
    for p, ext, name in platforms:
        sa = SocialAccount(
            organization_id=org.id,
            platform=p,
            external_account_id=ext,
            account_name=name,
            status=SocialAccountStatusEnum.CONNECTED
        )
        db.add(sa)
        accounts[p] = sa
    db.commit()

    camp1 = Campaign(organization_id=org.id, name="Q3 Product Launch", objective="Drive signups", status=CampaignStatusEnum.ACTIVE, created_by=user1.id)
    camp2 = Campaign(organization_id=org.id, name="Brand Awareness", status=CampaignStatusEnum.ACTIVE, created_by=user1.id)
    db.add_all([camp1, camp2])
    db.commit()
    
    # Seed AIInsights
    ai_insight1 = AIInsight(
        organization_id=org.id,
        campaign_id=camp1.id,
        type=InsightTypeEnum.PERFORMANCE,
        title="High Engagement on LinkedIn",
        summary="LinkedIn posts are driving 40% more engagement than other platforms.",
        recommendation="Increase posting frequency on LinkedIn by 2x for the Q3 Product Launch.",
        confidence=0.88,
        metadata_={"priority": "HIGH"}
    )
    ai_insight2 = AIInsight(
        organization_id=org.id,
        campaign_id=camp2.id,
        type=InsightTypeEnum.CONTENT,
        title="Video Content Performing Well",
        summary="Posts with video content have a 15% higher click-through rate.",
        recommendation="Include more video variants in the Brand Awareness campaign.",
        confidence=0.92,
        metadata_={"priority": "MEDIUM"}
    )
    db.add_all([ai_insight1, ai_insight2])
    db.commit()

    # Seed 30 days of data
    import random
    import uuid
    base_date = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=30)
    
    for i in range(25): # 25 posts
        days_offset = i + random.randint(0, 5)
        if days_offset > 30: days_offset = 30
        
        post_date = base_date + datetime.timedelta(days=days_offset)
        
        ci = ContentItem(
            campaign_id=camp1.id if i % 2 == 0 else camp2.id,
            content_type=ContentTypeEnum.SOCIAL,
            title=f"Post Title {i}",
            base_content=f"Base content for post {i}",
            status=ContentStatusEnum.PUBLISHED,
            created_by=user1.id
        )
        db.add(ci)
        db.commit()

        # Generate a variant for a random platform
        p = list(PlatformEnum)[i % 4]
        var = PlatformVariant(
            content_item_id=ci.id,
            platform=p,
            content=f"Platform optimized content {i} for {p.value}",
            status=ContentStatusEnum.PUBLISHED
        )
        db.add(var)
        db.commit()

        sched = Schedule(
            platform_variant_id=var.id,
            scheduled_at=post_date,
            timezone="UTC",
            status=ScheduleStatusEnum.PUBLISHED
        )
        db.add(sched)
        db.commit()
        
        ext_id = f"mock_{uuid.uuid4().hex[:8]}"
        pub = PublishedPost(
            platform_variant_id=var.id,
            schedule_id=sched.id,
            social_account_id=accounts[p].id,
            external_post_id=ext_id,
            published_at=post_date,
            url=f"https://mock.social/{ext_id}",
            status=PublishedPostStatusEnum.PUBLISHED
        )
        db.add(pub)
        db.commit()

        # Analytics Snapshot
        # Use mock connector to get deterministic values
        from app.services.connectors.mock.mock_connector import mock_connector
        metrics = mock_connector.get_analytics(ext_id, p.value)
        
        snap = AnalyticsSnapshot(
            organization_id=org.id,
            campaign_id=ci.campaign_id,
            published_post_id=pub.id,
            platform=p,
            snapshot_date=post_date,
            impressions=metrics["impressions"],
            reach=metrics["reach"],
            likes=metrics["likes"],
            comments=metrics["comments"],
            shares=metrics["shares"],
            clicks=metrics["clicks"],
            engagement_rate=metrics["engagement_rate"],
        )
        db.add(snap)
        db.commit()

        # Sync engagement mock
        from app.services.engagement.engagement_sync_service import engagement_sync_service
        engagement_sync_service.sync_organization_engagement(org.id)

    # Seed Email Audiences (Moved OUTSIDE the loop)
    from app.models.enums import EmailCampaignStatusEnum
    audience1 = Audience(organization_id=org.id, name="Newsletter Subscribers", contact_count=1200)
    audience2 = Audience(organization_id=org.id, name="Existing Customers", contact_count=450)
    audience3 = Audience(organization_id=org.id, name="Leads", contact_count=320)
    db.add_all([audience1, audience2, audience3])
    db.commit()

    # Seed Email Campaigns (Moved OUTSIDE the loop)
    email1 = EmailCampaign(
        organization_id=org.id,
        name="Summer Sale Announcement",
        audience_id=audience2.id,
        campaign_id=camp1.id,  # FIXED NameError here
        subject="Exclusive Summer Savings Inside! ☀️",
        preview_text="Get 20% off our premium tier this week only.",
        body="Hi there,\n\nWe're celebrating summer with an exclusive 20% discount on all premium plans. Upgrade today and supercharge your marketing.\n\nBest,\nThe TechNova Team",
        cta="Upgrade Now",
        status=EmailCampaignStatusEnum.SENT,
        recipient_count=450,
        external_campaign_id="seed_email_1"
    )
    email2 = EmailCampaign(
        organization_id=org.id,
        name="Weekly Marketing Tips",
        audience_id=audience1.id,
        subject="3 Ways to Automate Your Social Media",
        preview_text="Stop wasting time on manual posting.",
        body="Hello,\n\nDid you know you can save 10 hours a week by automating your social media schedule? Here are three tips to get started...\n\nCheers,\nTechNova",
        cta="Read the Guide",
        status=EmailCampaignStatusEnum.APPROVED
    )
    db.add_all([email1, email2])
    db.commit()

    print("\nSeed completed successfully.")
    print("----------------------------")
    print(f"Organization: {org.name}")
    print(f"Users: {db.query(User).filter_by(email=user_email).count()}")
    print(f"Campaigns: {db.query(Campaign).filter_by(organization_id=org.id).count()}")
    print(f"Social Accounts: {db.query(SocialAccount).filter_by(organization_id=org.id).count()}")
    print(f"Content Items: {db.query(ContentItem).join(Campaign).filter(Campaign.organization_id==org.id).count()}")
    print(f"Platform Variants: {db.query(PlatformVariant).join(ContentItem).join(Campaign).filter(Campaign.organization_id==org.id).count()}")
    print(f"Published Posts: {db.query(PublishedPost).join(SocialAccount).filter(SocialAccount.organization_id==org.id).count()}")
    print(f"Engagement Items: {db.query(EngagementItem).join(SocialAccount).filter(SocialAccount.organization_id==org.id).count()}")
    print(f"Analytics Snapshots: {db.query(AnalyticsSnapshot).filter_by(organization_id=org.id).count()}")
    print(f"AI Insights: {db.query(AIInsight).filter_by(organization_id=org.id).count()}")
    print(f"Audiences: {db.query(Audience).filter_by(organization_id=org.id).count()}")
    print(f"Email Campaigns: {db.query(EmailCampaign).filter_by(organization_id=org.id).count()}")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
