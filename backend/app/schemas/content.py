from typing import Optional, Dict, Any, List
from pydantic import BaseModel, ConfigDict
from datetime import datetime

class RejectRequest(BaseModel):
    reason: str

class VariantUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    caption: Optional[str] = None
    cta: Optional[str] = None
    hashtags: Optional[List[str]] = None

class PlatformVariantResponse(BaseModel):
    id: int
    content_item_id: int
    platform: str
    content: Optional[str] = None
    caption: Optional[str] = None
    cta: Optional[str] = None
    hashtags: Optional[List[str]] = None
    status: str
    ai_score: Optional[float] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class ContentItemResponse(BaseModel):
    id: int
    campaign_id: int
    title: Optional[str] = None
    base_content: Optional[str] = None
    status: str
    platform_variants: List[PlatformVariantResponse] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
