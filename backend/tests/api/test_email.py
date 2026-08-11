import pytest
from app.services.email.email_generation_service import email_generation_service
from app.models.domain import BrandProfile

@pytest.mark.asyncio
async def test_email_brand_safety():
    bp = BrandProfile(prohibited_words=["spam", "free money"], prohibited_claims=["number one in the world"])
    
    # Should pass
    email_generation_service.validate_brand_safety("We offer a great value product.", bp)
    
    # Should fail word
    with pytest.raises(ValueError, match="prohibited word"):
        email_generation_service.validate_brand_safety("Get free money now!", bp)
        
    # Should fail claim
    with pytest.raises(ValueError, match="prohibited claim"):
        email_generation_service.validate_brand_safety("We are the number one in the world.", bp)

@pytest.mark.asyncio
async def test_mock_email_provider():
    from app.services.email.mock_email_provider import mock_email_provider
    
    res = mock_email_provider.send_email(1, "Normal Subject", "Body", 100)
    assert res["success"] is True
    assert res["recipient_count"] == 100
    
    with pytest.raises(Exception, match="error triggered by subject"):
        mock_email_provider.send_email(2, "SYSTEM ERROR PLEASE READ", "Body", 10)

@pytest.mark.asyncio
async def test_email_analytics():
    from app.services.email.email_analytics_service import email_analytics_service
    from unittest.mock import MagicMock
    
    # Mock an email campaign
    mock_db = MagicMock()
    mock_email = MagicMock()
    mock_email.status = "SENT"
    mock_email.recipient_count = 1000
    mock_email.external_campaign_id = "test_hash"
    
    mock_db.query().filter().first.return_value = mock_email
    
    stats = email_analytics_service.get_campaign_analytics(mock_db, 1)
    assert stats["recipient_count"] == 1000
    assert stats["delivered"] <= 1000
    assert stats["opened"] <= stats["delivered"]
    assert stats["clicked"] <= stats["opened"]
    assert stats["bounced"] == 1000 - stats["delivered"]
