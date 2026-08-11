from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.campaign import CampaignCreate, CampaignUpdate, CampaignResponse, GenerateContentRequest
from app.services.campaigns.campaign_service import campaign_service
from app.api.v1.auth import verify_organization_access, require_role
from app.models.enums import RoleEnum

router = APIRouter()

@router.get("/organizations/{organization_id}/campaigns", response_model=List[CampaignResponse])
def get_campaigns(organization_id: int, db: Session = Depends(get_db), _ = Depends(verify_organization_access)):
    return campaign_service.get_campaigns(db, organization_id)

@router.post("/organizations/{organization_id}/campaigns", response_model=CampaignResponse, status_code=201)
def create_campaign(organization_id: int, campaign_in: CampaignCreate, db: Session = Depends(get_db), _ = Depends(require_role(RoleEnum.OWNER, RoleEnum.ADMIN))):
    return campaign_service.create_campaign(db, organization_id, campaign_in)

@router.get("/organizations/{organization_id}/campaigns/{campaign_id}", response_model=CampaignResponse)
def get_campaign(organization_id: int, campaign_id: int, db: Session = Depends(get_db), _ = Depends(verify_organization_access)):
    return campaign_service.get_campaign(db, campaign_id, organization_id)

@router.patch("/organizations/{organization_id}/campaigns/{campaign_id}", response_model=CampaignResponse)
def update_campaign(organization_id: int, campaign_id: int, campaign_in: CampaignUpdate, db: Session = Depends(get_db), _ = Depends(require_role(RoleEnum.OWNER, RoleEnum.ADMIN))):
    return campaign_service.update_campaign(db, campaign_id, organization_id, campaign_in)

@router.post("/organizations/{organization_id}/campaigns/{campaign_id}/generate-content")
async def generate_content(organization_id: int, campaign_id: int, request: GenerateContentRequest, db: Session = Depends(get_db), _ = Depends(require_role(RoleEnum.OWNER, RoleEnum.ADMIN, RoleEnum.EDITOR))):
    return await campaign_service.generate_campaign_content(db, campaign_id, organization_id, request.platforms or [])

