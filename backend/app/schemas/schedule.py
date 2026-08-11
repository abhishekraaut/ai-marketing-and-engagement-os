from typing import Optional, Dict, Any, List
from pydantic import BaseModel, ConfigDict
from datetime import datetime

class ScheduleCreate(BaseModel):
    social_account_id: int
    scheduled_at: datetime
    timezone: str = "UTC"

class ScheduleResponse(BaseModel):
    id: int
    platform_variant_id: int
    scheduled_at: datetime
    timezone: str
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CalendarEventResponse(BaseModel):
    schedule_id: int
    campaign_id: int
    content_item_id: int
    platform_variant_id: int
    platform: str
    title: Optional[str] = None
    content: Optional[str] = None
    caption: Optional[str] = None
    scheduled_at: datetime
    timezone: str
    status: str

    model_config = ConfigDict(from_attributes=True)
