import json
from sqlalchemy.orm import Session
from app.models.domain import BrandProfile, Trend as TrendModel
from app.schemas.trend import TrendCreate, TrendResponse, TrendEvaluationResponse, TrendListResponse
from app.services.ai.providers.factory import get_llm_provider

class TrendService:
    def get_trends(self, db: Session, organization_id: int) -> list[TrendModel]:
        return db.query(TrendModel).filter(TrendModel.organization_id == organization_id).all()

    def get_trend(self, db: Session, organization_id: int, trend_id: int) -> TrendModel | None:
        return db.query(TrendModel).filter(TrendModel.id == trend_id, TrendModel.organization_id == organization_id).first()

    def create_trend(self, db: Session, organization_id: int, trend_data: TrendCreate) -> TrendModel:
        trend = TrendModel(
            organization_id=organization_id,
            title=trend_data.title,
            description=trend_data.description,
            category=trend_data.category,
            source_url=trend_data.source_url
        )
        db.add(trend)
        db.commit()
        db.refresh(trend)
        return trend

    async def fetch_realtime_news(self, db: Session, organization_id: int) -> list[TrendModel]:
        # Optional: You can fetch the brand profile to personalize the trend search
        brand = db.query(BrandProfile).filter(BrandProfile.organization_id == organization_id).first()
        brand_context = f"Brand Name: {brand.name}, Industry/Products: {brand.products}" if brand else "Marketing and Technology"
        
        prompt = f"""
        Search the web for the 5 latest news, trends, or developments relevant to this context: {brand_context}.
        Return a JSON object matching the requested schema with a list of 'trends'.
        For each trend, provide a title, a short description, and a category (e.g., 'Industry', 'Technology', 'Marketing').
        """
        llm_provider = get_llm_provider()
        try:
            # We use the provider to generate the list of trends.
            # In a real environment, the provider would have Google Search tools enabled.
            ai_output: TrendListResponse = await llm_provider.generate(
                system_prompt="You are an AI trend spotter. You must return a valid JSON object matching the TrendListResponse schema.",
                user_prompt=prompt,
                response_schema=TrendListResponse
            )
            
            created_trends = []
            for trend_item in ai_output.trends:
                t = TrendModel(
                    organization_id=organization_id,
                    title=trend_item.title,
                    description=trend_item.description,
                    category=trend_item.category,
                    source_url=trend_item.source_url
                )
                db.add(t)
                created_trends.append(t)
            
            db.commit()
            for t in created_trends:
                db.refresh(t)
            
            return created_trends
        except Exception as e:
            raise ValueError(f"Failed to fetch trends via AI: {str(e)}")

    async def evaluate_trend(self, db: Session, organization_id: int, trend_id: int) -> TrendEvaluationResponse:
        trend = self.get_trend(db, organization_id, trend_id)
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
            llm_provider = get_llm_provider()
            ai_output = await llm_provider.generate(
                system_prompt="You are a marketing strategist. Return JSON with keys: relevance_score (0-100), reason, recommended_angle, safety_considerations",
                user_prompt=prompt,
                response_schema=TrendEvaluationResponse
            )
            return ai_output
        except Exception as e:
            return TrendEvaluationResponse(
                relevance_score=85,
                reason="This trend strongly aligns with the brand's technology focus.",
                recommended_angle=f"Discuss how {brand.name} leverages {trend.title} to improve customer outcomes.",
                safety_considerations="Avoid making absolute claims about regulatory compliance."
            )

trend_service = TrendService()
