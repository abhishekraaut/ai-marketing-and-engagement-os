import json
from sqlalchemy.orm import Session
from app.models.domain import BrandProfile
from app.schemas.trend import Trend, TrendEvaluationResponse
from app.services.ai.providers.mock_provider import mock_provider

MOCK_TRENDS = [
    Trend(id="t1", title="AI Regulation", description="New regulations around AI usage in marketing and data privacy.", category="Industry"),
    Trend(id="t2", title="Enterprise AI Adoption", description="More companies are adopting AI for daily operations.", category="Technology"),
    Trend(id="t3", title="Cybersecurity", description="Increased focus on data protection and zero-trust architectures.", category="Security"),
    Trend(id="t4", title="Developer Productivity", description="Tools to boost software engineering velocity.", category="Technology"),
    Trend(id="t5", title="Cloud Computing", description="Shift towards multi-cloud and edge computing solutions.", category="Infrastructure"),
    Trend(id="t6", title="Marketing Automation", description="Personalization at scale using ML models.", category="Marketing")
]

class TrendService:
    def get_trends(self) -> list[Trend]:
        return MOCK_TRENDS

    def get_trend(self, trend_id: str) -> Trend | None:
        for trend in MOCK_TRENDS:
            if trend.id == trend_id:
                return trend
        return None

    async def evaluate_trend(self, db: Session, organization_id: int, trend_id: str) -> TrendEvaluationResponse:
        trend = self.get_trend(trend_id)
        if not trend:
            raise ValueError("Trend not found")

        brand = db.query(BrandProfile).filter(BrandProfile.organization_id == organization_id).first()
        if not brand:
            raise ValueError("Brand Profile must be configured before evaluating trends.")

        # Simulate an AI evaluation
        prompt = f"""
        Evaluate this trend for the brand.
        Brand: {brand.name}
        Audience: {brand.target_audience}
        Tone: {brand.tone}
        Trend: {trend.title} - {trend.description}
        """

        try:
            # We use mock provider for a structured JSON response
            ai_output = await mock_provider.generate(
                system_prompt="You are a marketing strategist. Return JSON with keys: relevance_score (0-100), reason, recommended_angle, safety_considerations",
                user_prompt=prompt,
                response_schema=TrendEvaluationResponse
            )
            return ai_output
        except Exception as e:
            # Fallback mock response in case mock_provider doesn't support the schema directly in its mocked output
            return TrendEvaluationResponse(
                relevance_score=85,
                reason="This trend strongly aligns with the brand's technology focus.",
                recommended_angle=f"Discuss how {brand.name} leverages {trend.title} to improve customer outcomes.",
                safety_considerations="Avoid making absolute claims about regulatory compliance."
            )

trend_service = TrendService()
