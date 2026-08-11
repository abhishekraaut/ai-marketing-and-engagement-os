from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional
from pydantic import BaseModel
from app.db.session import get_db
from app.models.domain import EngagementItem, SocialAccount, AuditLog
from app.models.enums import ReplyStatusEnum
from app.services.engagement.engagement_sync_service import engagement_sync_service
from app.services.engagement.reply_service import reply_service
from app.services.connectors.mock.mock_connector import mock_connector
from app.api.v1.auth import verify_organization_access, require_role
from app.models.enums import RoleEnum

router = APIRouter()

class EditReplyRequest(BaseModel):
    reply: str

@router.get("/organizations/{organization_id}/engagements")
def list_engagements(
    organization_id: int, 
    platform: Optional[str] = None, 
    sentiment: Optional[str] = None,
    reply_status: Optional[str] = None,
    db: Session = Depends(get_db),
    _ = Depends(verify_organization_access)
):
    query = db.query(EngagementItem).join(SocialAccount).filter(SocialAccount.organization_id == organization_id)
    
    if platform and platform != "ALL":
        query = query.filter(SocialAccount.platform == platform)
    if sentiment and sentiment != "ALL":
        query = query.filter(EngagementItem.sentiment == sentiment)
    if reply_status and reply_status != "ALL":
        if reply_status == "NEEDS_REPLY":
            query = query.filter(EngagementItem.reply_status.in_([ReplyStatusEnum.PENDING, ReplyStatusEnum.AI_DRAFTED]))
        else:
            query = query.filter(EngagementItem.reply_status == reply_status)
            
    items = query.order_by(desc(EngagementItem.created_at)).all()
    
    return [
        {
            "id": item.id,
            "platform": item.social_account.platform.value,
            "author_name": item.author_name,
            "author_handle": item.author_external_id,
            "content": item.content,
            "engagement_type": item.type.value,
            "sentiment": item.sentiment.value if item.sentiment else "NEUTRAL",
            "category": item.category.value if item.category else "OTHER",
            "reply_status": item.reply_status.value,
            "ai_generated_reply": item.ai_generated_reply,
            "human_reply": item.human_reply,
            "created_at": item.created_at
        }
        for item in items
    ]

@router.post("/organizations/{organization_id}/engagements/sync")
def sync_engagements(organization_id: int, _ = Depends(verify_organization_access)):
    synced = engagement_sync_service.sync_organization_engagement(organization_id)
    return {"status": "success", "synced_items": synced}

@router.post("/organizations/{organization_id}/engagements/{engagement_id}/generate-reply")
def generate_reply(organization_id: int, engagement_id: int, db: Session = Depends(get_db), _ = Depends(require_role(RoleEnum.OWNER, RoleEnum.ADMIN, RoleEnum.EDITOR))):
    item = _get_engagement(db, organization_id, engagement_id)
    if item.reply_status == ReplyStatusEnum.REPLIED:
        raise HTTPException(status_code=400, detail="Already replied")
        
    try:
        updated = reply_service.generate_reply(db, engagement_id)
        return {"status": "success", "ai_generated_reply": updated.ai_generated_reply}
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

@router.patch("/organizations/{organization_id}/engagements/{engagement_id}/reply")
def update_reply(organization_id: int, engagement_id: int, payload: EditReplyRequest, db: Session = Depends(get_db), _ = Depends(require_role(RoleEnum.OWNER, RoleEnum.ADMIN))):
    item = _get_engagement(db, organization_id, engagement_id)
    if item.reply_status == ReplyStatusEnum.REPLIED:
        raise HTTPException(status_code=400, detail="Already replied")
        
    # Validate against brand safety again
    try:
        brand = item.social_account.organization.brand_profiles[0]
        reply_service.validate_brand_safety(payload.reply, brand)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
        
    item.human_reply = payload.reply
    db.commit()
    
    # Audit log
    db.add(AuditLog(organization_id=organization_id, action="ENGAGEMENT_REPLY_EDITED", entity_type="EngagementItem", entity_id=str(engagement_id)))
    db.commit()
    
    return {"status": "success", "human_reply": item.human_reply}

@router.post("/organizations/{organization_id}/engagements/{engagement_id}/approve-reply")
def approve_reply(organization_id: int, engagement_id: int, db: Session = Depends(get_db), _ = Depends(require_role(RoleEnum.OWNER, RoleEnum.ADMIN))):
    item = _get_engagement(db, organization_id, engagement_id)
    if item.reply_status == ReplyStatusEnum.REPLIED:
        raise HTTPException(status_code=400, detail="Already replied")
        
    reply_text = item.human_reply or item.ai_generated_reply
    if not reply_text:
        raise HTTPException(status_code=400, detail="No reply exists to approve")
        
    try:
        brand = item.social_account.organization.brand_profiles[0]
        reply_service.validate_brand_safety(reply_text, brand)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
        
    item.reply_status = ReplyStatusEnum.APPROVED
    db.commit()
    
    db.add(AuditLog(organization_id=organization_id, action="ENGAGEMENT_REPLY_APPROVED", entity_type="EngagementItem", entity_id=str(engagement_id)))
    db.commit()
    return {"status": "success"}

@router.post("/organizations/{organization_id}/engagements/{engagement_id}/send-reply")
def send_reply(organization_id: int, engagement_id: int, db: Session = Depends(get_db), _ = Depends(require_role(RoleEnum.OWNER, RoleEnum.ADMIN))):
    item = _get_engagement(db, organization_id, engagement_id)
    
    if item.reply_status == ReplyStatusEnum.REPLIED:
        return {"status": "success", "external_reply_id": item.external_reply_id}
        
    if item.reply_status != ReplyStatusEnum.APPROVED:
        raise HTTPException(status_code=400, detail="Reply must be approved before sending")
        
    reply_text = item.human_reply or item.ai_generated_reply
    
    # Send mock reply
    try:
        reply_id = mock_connector.reply_to_comment(item.external_id, reply_text)
        item.external_reply_id = reply_id
        item.reply_status = ReplyStatusEnum.REPLIED
        db.commit()
        
        db.add(AuditLog(organization_id=organization_id, action="ENGAGEMENT_REPLY_SENT", entity_type="EngagementItem", entity_id=str(engagement_id)))
        db.commit()
        return {"status": "success", "external_reply_id": reply_id}
    except Exception as e:
        db.add(AuditLog(organization_id=organization_id, action="ENGAGEMENT_REPLY_FAILED", entity_type="EngagementItem", entity_id=str(engagement_id)))
        db.commit()
        raise HTTPException(status_code=500, detail="Failed to send reply")

def _get_engagement(db: Session, org_id: int, engagement_id: int) -> EngagementItem:
    item = db.query(EngagementItem).join(SocialAccount).filter(
        EngagementItem.id == engagement_id,
        SocialAccount.organization_id == org_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Engagement not found")
    return item
