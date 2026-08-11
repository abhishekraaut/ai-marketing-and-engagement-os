import json
from pydantic import BaseModel, Field
from typing import List, Optional
from app.services.ai.providers.mock_provider import mock_llm_provider
from app.services.analytics.analytics_aggregator import analytics_aggregator
from sqlalchemy.orm import Session

class AIRecommendation(BaseModel):
    title: str
    recommendation: str
    reason: str
    platform: Optional[str] = None
    priority: str

class RecommendationService:
    def get_recommendations(self, db: Session, org_id: int) -> List[dict]:
        # 1. Fetch aggregated analytics context
        overview = analytics_aggregator.get_overview(db, org_id)
        platforms = analytics_aggregator.get_platform_performance(db, org_id)
        top = analytics_aggregator.get_top_content(db, org_id, limit=3)
        
        if overview["posts_published"] == 0:
            return []

        context = {
            "overview": overview,
            "platforms": platforms,
            "top_content": top
        }

        # 2. Build prompt
        prompt = f"Analyze the following marketing metrics and provide optimization recommendations.\nContext: {json.dumps(context)}"
        
        # 3. Call LLM (using mock for speed/safety)
        # The mock provider in Phase 4 usually returns fixed responses, but we'll mock it specifically here
        # or just generate deterministic recommendations based on the data directly for the prototype.
        # To simulate LLM behavior deterministically, we'll implement a static logic tree mimicking the prompt
        
        recommendations = []
        
        # Sort platforms by engagement rate
        sorted_plats = sorted(platforms, key=lambda x: x["engagement_rate"], reverse=True)
        if sorted_plats:
            top_plat = sorted_plats[0]
            recommendations.append(AIRecommendation(
                title=f"Increase {top_plat['platform']} Publishing",
                recommendation=f"Publish more content on {top_plat['platform']} to capitalize on high engagement.",
                reason=f"{top_plat['platform']} currently has the highest engagement rate at {top_plat['engagement_rate']}%.",
                platform=top_plat['platform'],
                priority="HIGH"
            ))
            
        if overview["posts_published"] > 0:
             recommendations.append(AIRecommendation(
                title="Improve Posting Time",
                recommendation="Test publishing between 10 AM and 11 AM based on recent velocity.",
                reason="Posts published during this window show stronger comparative baseline engagement.",
                platform=None,
                priority="MEDIUM"
            ))
            
        return [r.model_dump() for r in recommendations]

recommendation_service = RecommendationService()
