import pytest
from sqlalchemy.orm import Session
from app.services.engagement.sentiment_service import sentiment_service
from app.models.enums import SentimentEnum, EngagementCategoryEnum

@pytest.mark.asyncio
async def test_sentiment_classification():
    res = sentiment_service.classify("This is excellent and I love it!")
    assert res["sentiment"] == SentimentEnum.POSITIVE
    assert res["category"] == EngagementCategoryEnum.PRAISE

    res2 = sentiment_service.classify("This failed and doesn't work.")
    assert res2["sentiment"] == SentimentEnum.NEGATIVE
    assert res2["category"] == EngagementCategoryEnum.COMPLAINT
    
    res3 = sentiment_service.classify("What is the cost?")
    assert res3["sentiment"] == SentimentEnum.POSITIVE # Matches "cost"
    assert res3["category"] == EngagementCategoryEnum.LEAD
    
    res4 = sentiment_service.classify("Can we add an API?")
    assert res4["sentiment"] == SentimentEnum.NEUTRAL
    assert res4["category"] == EngagementCategoryEnum.OTHER

@pytest.mark.asyncio
async def test_brand_safety():
    from app.services.engagement.reply_service import reply_service
    from app.models.domain import BrandProfile
    
    bp = BrandProfile(prohibited_words=["cheap", "hack"], prohibited_claims=["100% guarantee"])
    
    # Should pass
    reply_service.validate_brand_safety("Thanks, this is great value.", bp)
    
    # Should fail word
    with pytest.raises(ValueError):
        reply_service.validate_brand_safety("This is cheap.", bp)
        
    # Should fail claim
    with pytest.raises(ValueError):
        reply_service.validate_brand_safety("We offer a 100% guarantee on all products.", bp)
