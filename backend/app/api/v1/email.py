from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.db.session import get_db
from app.models.domain import EmailCampaign, AuditLog, BrandProfile
from app.models.enums import EmailCampaignStatusEnum
from app.services.email.email_generation_service import email_generation_service
from app.services.email.email_campaign_service import email_campaign_service
from app.services.email.email_analytics_service import email_analytics_service
from app.api.v1.auth import verify_organization_access, require_role
from app.models.enums import RoleEnum

router = APIRouter()

class CreateEmailRequest(BaseModel):
    name: str
    audience_id: int
    campaign_id: Optional[int] = None

class EditEmailRequest(BaseModel):
    subject: str
    preview_text: str
    body: str
    cta: str

class ScheduleEmailRequest(BaseModel):
    scheduled_at: datetime

@router.get("/organizations/{organization_id}/email-campaigns")
def list_email_campaigns(organization_id: int, db: Session = Depends(get_db), _ = Depends(verify_organization_access)):
    items = db.query(EmailCampaign).filter(EmailCampaign.organization_id == organization_id).order_by(desc(EmailCampaign.created_at)).all()
    return [
        {
            "id": item.id,
            "name": item.name,
            "audience_name": item.audience.name if item.audience else "Unknown",
            "status": item.status.value,
            "scheduled_at": item.scheduled_at,
            "sent_at": item.sent_at,
            "recipient_count": item.recipient_count,
            "subject": item.subject
        }
        for item in items
    ]

@router.get("/organizations/{organization_id}/email-campaigns/{email_id}")
def get_email_campaign(organization_id: int, email_id: int, db: Session = Depends(get_db), _ = Depends(verify_organization_access)):
    item = _get_email(db, organization_id, email_id)
    return {
        "id": item.id,
        "name": item.name,
        "audience_id": item.audience_id,
        "audience_name": item.audience.name if item.audience else "Unknown",
        "campaign_id": item.campaign_id,
        "subject": item.subject,
        "preview_text": item.preview_text,
        "body": item.body,
        "cta": item.cta,
        "status": item.status.value,
        "scheduled_at": item.scheduled_at,
        "sent_at": item.sent_at,
        "recipient_count": item.recipient_count
    }

@router.post("/organizations/{organization_id}/email-campaigns")
def create_email_campaign(organization_id: int, payload: CreateEmailRequest, db: Session = Depends(get_db), _ = Depends(require_role(RoleEnum.OWNER, RoleEnum.ADMIN))):
    email = EmailCampaign(
        organization_id=organization_id,
        name=payload.name,
        audience_id=payload.audience_id,
        campaign_id=payload.campaign_id,
        status=EmailCampaignStatusEnum.DRAFT
    )
    db.add(email)
    db.commit()
    db.refresh(email)
    
    db.add(AuditLog(organization_id=organization_id, action="EMAIL_CAMPAIGN_CREATED", entity_type="EmailCampaign", entity_id=str(email.id)))
    db.commit()
    return {"status": "success", "id": email.id}

@router.post("/organizations/{organization_id}/email-campaigns/{email_id}/generate")
def generate_email(organization_id: int, email_id: int, db: Session = Depends(get_db), _ = Depends(require_role(RoleEnum.OWNER, RoleEnum.ADMIN, RoleEnum.EDITOR))):
    item = _get_email(db, organization_id, email_id)
    if item.status in [EmailCampaignStatusEnum.SCHEDULED, EmailCampaignStatusEnum.SENDING, EmailCampaignStatusEnum.SENT]:
        raise HTTPException(status_code=400, detail="Cannot regenerate a scheduled or sent email")
        
    try:
        updated = email_generation_service.generate_email_content(db, email_id)
        return {"status": "success"}
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

@router.patch("/organizations/{organization_id}/email-campaigns/{email_id}")
def update_email(organization_id: int, email_id: int, payload: EditEmailRequest, db: Session = Depends(get_db), _ = Depends(require_role(RoleEnum.OWNER, RoleEnum.ADMIN))):
    item = _get_email(db, organization_id, email_id)
    if item.status in [EmailCampaignStatusEnum.SCHEDULED, EmailCampaignStatusEnum.SENDING, EmailCampaignStatusEnum.SENT]:
        raise HTTPException(status_code=400, detail="Cannot edit a scheduled or sent email")
        
    item.subject = payload.subject
    item.preview_text = payload.preview_text
    item.body = payload.body
    item.cta = payload.cta
    db.commit()
    return {"status": "success"}

@router.post("/organizations/{organization_id}/email-campaigns/{email_id}/approve")
def approve_email(organization_id: int, email_id: int, db: Session = Depends(get_db), _ = Depends(require_role(RoleEnum.OWNER, RoleEnum.ADMIN))):
    item = _get_email(db, organization_id, email_id)
    if not item.body:
        raise HTTPException(status_code=400, detail="Email is empty")
        
    # Validation
    brand = db.query(BrandProfile).filter(BrandProfile.organization_id == organization_id).first()
    text = (item.subject or "") + (item.preview_text or "") + (item.body or "") + (item.cta or "")
    try:
        email_generation_service.validate_brand_safety(text, brand)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
        
    item.status = EmailCampaignStatusEnum.APPROVED
    db.add(AuditLog(organization_id=organization_id, action="EMAIL_CAMPAIGN_APPROVED", entity_type="EmailCampaign", entity_id=str(email_id)))
    db.commit()
    return {"status": "success"}

@router.post("/organizations/{organization_id}/email-campaigns/{email_id}/schedule")
def schedule_email(organization_id: int, email_id: int, payload: ScheduleEmailRequest, db: Session = Depends(get_db), _ = Depends(require_role(RoleEnum.OWNER, RoleEnum.ADMIN))):
    _get_email(db, organization_id, email_id) # Access check
    try:
        email_campaign_service.schedule_campaign(db, email_id, payload.scheduled_at)
        return {"status": "success"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/organizations/{organization_id}/email-campaigns/{email_id}/send")
def send_email(organization_id: int, email_id: int, db: Session = Depends(get_db), _ = Depends(require_role(RoleEnum.OWNER, RoleEnum.ADMIN))):
    _get_email(db, organization_id, email_id) # Access check
    try:
        email_campaign_service.send_email(db, email_id)
        return {"status": "success"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to send email")

@router.get("/organizations/{organization_id}/email-campaigns/{email_id}/analytics")
def get_email_analytics(organization_id: int, email_id: int, db: Session = Depends(get_db), _ = Depends(verify_organization_access)):
    _get_email(db, organization_id, email_id) # Access check
    return email_analytics_service.get_campaign_analytics(db, email_id)

def _get_email(db: Session, org_id: int, email_id: int) -> EmailCampaign:
    item = db.query(EmailCampaign).filter(EmailCampaign.id == email_id, EmailCampaign.organization_id == org_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Email not found")
    return item
