import os
import sys
import datetime
from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine
from app.models.user import User, Organization, OrganizationMember
from app.models.domain import (
    BrandProfile, SocialAccount, Campaign, ContentItem, PlatformVariant,
    Schedule, PublishedPost, EngagementItem, EmailCampaign, Audience,
    AnalyticsSnapshot, AIInsight, AuditLog
)
from app.models.enums import *

def seed_data(db: Session):
    # Clear existing to prevent duplicate errors when seeding multiple times if constraint fails
    # This is a basic approach. Better to drop/recreate in dev.
    pass

    # 1. Users
    user1 = User(email="founder@aisaastas.com", name="Alice Founder", hashed_password="fakehash", is_active=True)
    user2 = User(email="marketer@aisaastas.com", name="Bob Marketer", hashed_password="fakehash", is_active=True)
    db.add_all([user1, user2])
    db.commit()

    # 2. Organization
    org = Organization(name="AI SaaS Inc.", slug="ai-saas-inc")
    db.add(org)
    db.commit()
    
    # Memberships
    m1 = OrganizationMember(organization_id=org.id, user_id=user1.id, role=RoleEnum.OWNER)
    m2 = OrganizationMember(organization_id=org.id, user_id=user2.id, role=RoleEnum.ADMIN)
    db.add_all([m1, m2])
    db.commit()

    # 3. Brand Profile
    bp = BrandProfile(
        organization_id=org.id,
        name="AI SaaS Brand",
        description="B2B AI Platform for marketing teams.",
        products=["AI Copywriter", "Analytics Agent"],
        target_audience=["CMOs", "Marketing Managers"],
        tone="Professional, innovative, confident",
        approved_messaging=["Empower your team with AI", "Data-driven decisions"],
        prohibited_words=["cheap", "magic"],
        prohibited_claims=["100% guarantee"],
        guidelines="Always use Oxford comma."
    )
    db.add(bp)
    db.commit()

    # 4. Social Accounts (Phase 3 requires all 4)
    sa1 = SocialAccount(
        organization_id=org.id,
        platform=PlatformEnum.LINKEDIN,
        external_account_id="li_12345",
        account_name="AI SaaS LinkedIn",
        status=SocialAccountStatusEnum.CONNECTED
    )
    sa2 = SocialAccount(
        organization_id=org.id,
        platform=PlatformEnum.X,
        external_account_id="x_98765",
        account_name="@aisaastas",
        status=SocialAccountStatusEnum.CONNECTED
    )
    sa3 = SocialAccount(
        organization_id=org.id,
        platform=PlatformEnum.INSTAGRAM,
        external_account_id="ig_111",
        account_name="aisaastas_ig",
        status=SocialAccountStatusEnum.DISCONNECTED
    )
    sa4 = SocialAccount(
        organization_id=org.id,
        platform=PlatformEnum.FACEBOOK,
        external_account_id="fb_222",
        account_name="AI SaaS FB Page",
        status=SocialAccountStatusEnum.CONNECTED
    )
    db.add_all([sa1, sa2, sa3, sa4])
    db.commit()

    # 5. Campaigns
    camp1 = Campaign(
        organization_id=org.id,
        name="Q3 Product Launch",
        objective="Drive signups",
        topic="New Analytics Agent",
        status=CampaignStatusEnum.ACTIVE,
        created_by=user2.id
    )
    camp2 = Campaign(
        organization_id=org.id,
        name="Brand Awareness Drip",
        status=CampaignStatusEnum.PLANNING,
        created_by=user1.id
    )
    db.add_all([camp1, camp2])
    db.commit()

    # Skip Content/Schedules logic for brevity as it's Phase 2...
    print("Seed data successfully injected for Phase 3.")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
