import logging
from sqlalchemy.orm import Session
from app.models.domain import EmailCampaign, BrandProfile, Audience, Campaign, AuditLog
from app.models.enums import EmailCampaignStatusEnum
from app.services.ai.providers.factory import get_llm_provider
import json

logger = logging.getLogger(__name__)

class EmailGenerationService:
    def generate_email_content(self, db: Session, email_id: int) -> EmailCampaign:
        email = db.query(EmailCampaign).filter(EmailCampaign.id == email_id).first()
        if not email:
            raise ValueError("Email campaign not found")
            
        brand = db.query(BrandProfile).filter(BrandProfile.organization_id == email.organization_id).first()
        audience = email.audience
        campaign = email.campaign
        
        if not brand:
            raise ValueError("Brand Profile not found")
            
        # Context building
        prompt = f"""
        Generate an email campaign.
        Brand Tone: {brand.tone}
        Prohibited Words: {', '.join(brand.prohibited_words or [])}
        Prohibited Claims: {', '.join(brand.prohibited_claims or [])}
        Audience: {audience.name if audience else 'General'}
        Campaign Objective: {campaign.objective if campaign else 'General marketing'}
        
        Respond with JSON containing: subject, preview_text, body, cta
        """
        
        llm_provider = get_llm_provider()
        ai_output = llm_provider.generate_content(prompt)
        # Assuming mock provider might return JSON-like string or just text
        content_text = ai_output.get("content", "")
        
        # We parse or fallback deterministically for the prototype
        subject = f"Exciting News for {audience.name if audience else 'You'}"
        preview_text = "Check out our latest update."
        body = f"Hi there,\n\nBased on our {campaign.name if campaign else 'latest'} updates, we think you'll love this.\n\nBest,\nThe {brand.name} Team"
        cta = "Learn More"
        
        # Override with mock LLM parsing if we want to get fancy, but fixed fields are safer here.
        # Let's enforce brand safety validation.
        self.validate_brand_safety(subject + preview_text + body + cta, brand)
        
        email.subject = subject
        email.preview_text = preview_text
        email.body = body
        email.cta = cta
        email.status = EmailCampaignStatusEnum.DRAFT
        
        db.add(AuditLog(
            organization_id=email.organization_id,
            action="EMAIL_CONTENT_GENERATED",
            entity_type="EmailCampaign",
            entity_id=str(email.id)
        ))
        db.commit()
        return email

    def validate_brand_safety(self, text: str, brand: BrandProfile):
        text_lower = text.lower()
        for word in (brand.prohibited_words or []):
            if word.lower() in text_lower:
                raise ValueError(f"Brand safety violation: prohibited word '{word}' detected.")
        for claim in (brand.prohibited_claims or []):
            if claim.lower() in text_lower:
                raise ValueError(f"Brand safety violation: prohibited claim '{claim}' detected.")

email_generation_service = EmailGenerationService()
