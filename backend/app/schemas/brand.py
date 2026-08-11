from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class BrandProfileBase(BaseModel):
    name: str
    description: Optional[str] = None
    products: Optional[List[str]] = None
    target_audience: Optional[List[str]] = None
    tone: Optional[str] = None
    approved_messaging: Optional[List[str]] = None
    prohibited_words: Optional[List[str]] = None
    prohibited_claims: Optional[List[str]] = None
    guidelines: Optional[str] = None

class BrandProfileCreate(BrandProfileBase):
    pass

class BrandProfileUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    products: Optional[List[str]] = None
    target_audience: Optional[List[str]] = None
    tone: Optional[str] = None
    approved_messaging: Optional[List[str]] = None
    prohibited_words: Optional[List[str]] = None
    prohibited_claims: Optional[List[str]] = None
    guidelines: Optional[str] = None

class BrandProfileResponse(BrandProfileBase):
    id: int
    organization_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
