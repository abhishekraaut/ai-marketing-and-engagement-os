from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.enums import CampaignStatusEnum

class CampaignBase(BaseModel):
    name: str
    objective: Optional[str] = None
    topic: Optional[str] = None
    target_audience: Optional[List[str]] = None
    tone: Optional[str] = None
    cta: Optional[str] = None
    status: CampaignStatusEnum
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class CampaignCreate(CampaignBase):
    status: CampaignStatusEnum = CampaignStatusEnum.DRAFT

class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    objective: Optional[str] = None
    topic: Optional[str] = None
    target_audience: Optional[List[str]] = None
    tone: Optional[str] = None
    cta: Optional[str] = None
    status: Optional[CampaignStatusEnum] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class CampaignResponse(CampaignBase):
    id: int
    organization_id: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class GenerateContentRequest(BaseModel):
    platforms: Optional[List[str]] = ["LINKEDIN", "INSTAGRAM", "FACEBOOK", "X"]
