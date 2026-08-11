import pytest
from sqlalchemy.orm import Session
from app.services.ai.orchestrator import ai_orchestrator
from app.models.domain import Campaign, BrandProfile

@pytest.mark.asyncio
async def test_ai_orchestrator_success(db_session: Session):
    # Relies on the seeded org and brand
    org_id = 1
    campaign = db_session.query(Campaign).filter(Campaign.organization_id == org_id).first()
    assert campaign
    
    platforms = ["LINKEDIN", "X"]
    
    result = await ai_orchestrator.generate_campaign_content(
        db=db_session,
        organization_id=org_id,
        campaign_id=campaign.id,
        platforms=platforms
    )
    
    assert result.campaign_summary is not None
    assert len(result.variants) == 2
    for v in result.variants:
        assert v.platform in platforms

@pytest.mark.asyncio
async def test_ai_orchestrator_brand_safety_failure(db_session: Session):
    org_id = 1
    campaign = db_session.query(Campaign).filter(Campaign.organization_id == org_id).first()
    
    brand = db_session.query(BrandProfile).filter(BrandProfile.organization_id == org_id).first()
    
    # Intentionally add a prohibited word that exists in the mock generation
    # e.g., the mock generates "whitepaper", we prohibit "whitepaper"
    original_prohibited = brand.prohibited_words
    brand.prohibited_words = (original_prohibited or []) + ["whitepaper"]
    db_session.commit()
    
    platforms = ["LINKEDIN"]
    
    with pytest.raises(ValueError, match="Prohibited word 'whitepaper' detected"):
        await ai_orchestrator.generate_campaign_content(
            db=db_session,
            organization_id=org_id,
            campaign_id=campaign.id,
            platforms=platforms
        )
        
    # Revert
    brand.prohibited_words = original_prohibited
    db_session.commit()
