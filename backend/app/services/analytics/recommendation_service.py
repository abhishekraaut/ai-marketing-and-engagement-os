import json
from pydantic import BaseModel, Field
from typing import List, Optional
from app.services.ai.providers.factory import get_llm_provider
from app.services.analytics.analytics_aggregator import analytics_aggregator
from sqlalchemy.orm import Session

class AIRecommendation(BaseModel):
    title: str
    recommendation: str
    reason: str
    platform: Optional[str] = None
    priority: str

class AIRecommendationList(BaseModel):
    recommendations: List[AIRecommendation]

class RecommendationService:
    async def get_recommendations(self, db: Session, org_id: int) -> List[dict]:
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
        system_prompt = "You are an expert AI marketing analyst. Analyze the provided metrics and return a list of exactly 3 actionable recommendations."
        user_prompt = f"Analyze the following marketing metrics and provide optimization recommendations.\nContext: {json.dumps(context)}"
        
        # 3. Call LLM
        llm_provider = get_llm_provider()
        try:
            result: AIRecommendationList = await llm_provider.generate(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                response_schema=AIRecommendationList
            )
            return [r.model_dump() for r in result.recommendations]
        except Exception as e:
            # Fallback in case of LLM error
            print(f"Error generating insights: {e}")
            return []

recommendation_service = RecommendationService()
