from typing import Optional, Any, Dict
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.enums import PlatformEnum, SocialAccountStatusEnum

class SocialAccountBase(BaseModel):
    platform: PlatformEnum
    account_name: Optional[str] = None

class SocialAccountCreate(SocialAccountBase):
    # During creation we might expect an external ID and token (mocked for now)
    external_account_id: str
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None

class SocialAccountUpdate(BaseModel):
    status: Optional[SocialAccountStatusEnum] = None
    account_name: Optional[str] = None

class SocialAccountResponse(SocialAccountBase):
    id: int
    organization_id: int
    external_account_id: str
    status: SocialAccountStatusEnum
    token_expires_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    # EXPLICITLY OMITTING access_token_encrypted AND refresh_token_encrypted

    model_config = ConfigDict(from_attributes=True)
