from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.domain import BrandProfile, Campaign
from app.services.ai.providers.factory import get_llm_provider
from app.services.ai.prompts.content_generation import PromptBuilder
from app.services.ai.schemas import GeneratedCampaignContent

class AIOrchestrator:
    async def generate_campaign_content(
        self,
        db: Session,
        organization_id: int,
        campaign_id: int,
        platforms: List[str],
        format: Optional[str] = "Standard Post"
    ) -> GeneratedCampaignContent:
        
        # 1. Load Campaign & Organization context
        campaign = db.query(Campaign).filter(
            Campaign.id == campaign_id,
            Campaign.organization_id == organization_id
        ).first()
        
        if not campaign:
            raise ValueError("Campaign not found")

        # 2. Load Brand Profile
        brand = db.query(BrandProfile).filter(
            BrandProfile.organization_id == organization_id
        ).first()
        
        if not brand:
            raise ValueError("Brand Profile must be configured before generating content.")

        # 3. Build Prompts
        system_prompt = PromptBuilder.build_system_prompt()
        user_prompt = PromptBuilder.build_campaign_prompt(brand, campaign, platforms, format)

        # 4. Call LLM Provider (Mock for now, could be swapped based on env vars)
        try:
            llm_provider = get_llm_provider()
            generated_content = await llm_provider.generate(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                response_schema=GeneratedCampaignContent
            )
        except Exception as e:
            raise RuntimeError(f"AI Provider failure: {str(e)}")

        # 5. Deterministic Brand Safety Validation
        # Check all variants against prohibited words and claims
        prohibited_words = [w.lower() for w in (brand.prohibited_words or [])]
        prohibited_claims = [c.lower() for c in (brand.prohibited_claims or [])]

        for variant in generated_content.variants:
            text_to_check = (variant.content + " " + (variant.caption or "") + " " + (variant.title or "")).lower()
            
            # Check Words
            for word in prohibited_words:
                if word in text_to_check:
                    raise ValueError(f"Brand safety violation: Prohibited word '{word}' detected in {variant.platform} variant.")
            
            # Check Claims
            for claim in prohibited_claims:
                if claim in text_to_check:
                    raise ValueError(f"Brand safety violation: Prohibited claim '{claim}' detected in {variant.platform} variant.")

            # Filter requested platforms to drop any extras the LLM returned
            if variant.platform not in platforms:
                variant.platform = "IGNORE" # We'll filter these out
                
        # Remove ignored platforms
        generated_content.variants = [v for v in generated_content.variants if v.platform != "IGNORE"]

        return generated_content

ai_orchestrator = AIOrchestrator()
