import pytest
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.services.analytics.analytics_aggregator import analytics_aggregator
from app.services.analytics.analytics_sync_service import analytics_sync_service
from app.services.analytics.recommendation_service import recommendation_service

@pytest.mark.asyncio
async def test_analytics_workflow(db_session: Session):
    # Just verify the services are available and callable.
    # The actual seed data will populate the db.
    assert hasattr(analytics_aggregator, 'get_overview')
    assert hasattr(analytics_aggregator, 'get_trends')
    assert hasattr(analytics_aggregator, 'get_platform_performance')
    assert hasattr(analytics_aggregator, 'get_top_content')
    
    assert hasattr(analytics_sync_service, 'sync_organization_analytics')
    assert hasattr(recommendation_service, 'get_recommendations')
    
    # We can fetch top content
    top = analytics_aggregator.get_top_content(db_session, organization_id=1, limit=3)
    assert isinstance(top, list)
    
    # Fetch overview
    ov = analytics_aggregator.get_overview(db_session, organization_id=1)
    assert "impressions" in ov
    assert "engagements" in ov
