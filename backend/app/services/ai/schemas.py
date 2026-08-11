from typing import List, Optional
from pydantic import BaseModel, Field

class GeneratedPlatformVariant(BaseModel):
    platform: str = Field(..., description="The social platform (e.g., LINKEDIN, X, FACEBOOK, INSTAGRAM)")
    title: Optional[str] = Field(None, description="Internal title or hook for the variant")
    content: str = Field(..., description="The main body text of the post")
    caption: Optional[str] = Field(None, description="Caption (particularly for image-heavy platforms like Instagram)")
    cta: Optional[str] = Field(None, description="Call to Action text")
    hashtags: List[str] = Field(default_factory=list, description="Relevant hashtags")
    engagement_score: int = Field(..., ge=0, le=100, description="Estimated engagement score out of 100")

class GeneratedCampaignContent(BaseModel):
    campaign_summary: str = Field(..., description="AI's summary of the campaign context and goal")
    variants: List[GeneratedPlatformVariant] = Field(..., description="The generated variants for each requested platform")
