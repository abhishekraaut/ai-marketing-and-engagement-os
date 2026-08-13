import logging
from sqlalchemy.orm import Session
from app.models.domain import EngagementItem, BrandProfile, AuditLog
from app.models.enums import ReplyStatusEnum
from app.services.ai.providers.factory import get_llm_provider
# In a real app we'd inject the actual LLMProvider based on tenant config

logger = logging.getLogger(__name__)

class ReplyService:
    def generate_reply(self, db: Session, engagement_id: int) -> EngagementItem:
        engagement = db.query(EngagementItem).filter(EngagementItem.id == engagement_id).first()
        if not engagement:
            raise ValueError("Engagement not found")
            
        brand = db.query(BrandProfile).filter(BrandProfile.organization_id == engagement.social_account.organization_id).first()
        if not brand:
            raise ValueError("Brand Profile not found")
            
        # Build Context
        prompt = f"""
        Generate a reply to this social media comment.
        Comment: {engagement.content}
        Brand Tone: {brand.tone}
        Prohibited Words: {', '.join(brand.prohibited_words or [])}
        Prohibited Claims: {', '.join(brand.prohibited_claims or [])}
        """
        
        # We use the mock LLM for deterministic speed
        llm_provider = get_llm_provider()
        ai_output = llm_provider.generate_content(prompt)
        ai_reply = ai_output.get("content", "Thanks for your feedback!")
        
        # Validation
        self.validate_brand_safety(ai_reply, brand)
        
        engagement.ai_generated_reply = ai_reply
        engagement.reply_status = ReplyStatusEnum.AI_DRAFTED
        db.commit()
        
        log = AuditLog(
            organization_id=engagement.social_account.organization_id,
            action="AI_REPLY_GENERATED",
            entity_type="EngagementItem",
            entity_id=str(engagement.id)
        )
        db.add(log)
        db.commit()
        
        return engagement

    def validate_brand_safety(self, text: str, brand: BrandProfile):
        text_lower = text.lower()
        for word in (brand.prohibited_words or []):
            if word.lower() in text_lower:
                raise ValueError(f"Brand safety violation: prohibited word '{word}' detected.")
                
        for claim in (brand.prohibited_claims or []):
            if claim.lower() in text_lower:
                raise ValueError(f"Brand safety violation: prohibited claim '{claim}' detected.")

reply_service = ReplyService()
