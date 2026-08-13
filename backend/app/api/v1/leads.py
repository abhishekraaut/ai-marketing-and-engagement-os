from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from app.db.session import get_db
from app.models.domain import Lead
from app.models.enums import LeadSourceEnum, LeadStatusEnum
from app.api.v1.auth import verify_organization_access

router = APIRouter()

class LeadCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    source: LeadSourceEnum
    status: LeadStatusEnum
    notes: Optional[str] = None

class LeadUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    source: Optional[LeadSourceEnum] = None
    status: Optional[LeadStatusEnum] = None
    notes: Optional[str] = None
    conversion_time_hours: Optional[float] = None

@router.get("/organizations/{organization_id}/leads")
def list_leads(organization_id: int, db: Session = Depends(get_db), _ = Depends(verify_organization_access)):
    return db.query(Lead).filter(Lead.organization_id == organization_id).all()

@router.post("/organizations/{organization_id}/leads")
def create_lead(organization_id: int, lead: LeadCreate, db: Session = Depends(get_db), _ = Depends(verify_organization_access)):
    new_lead = Lead(
        organization_id=organization_id, 
        name=lead.name, 
        email=lead.email,
        phone=lead.phone,
        source=lead.source,
        status=lead.status,
        notes=lead.notes
    )
    db.add(new_lead)
    db.commit()
    db.refresh(new_lead)
    return new_lead

@router.put("/organizations/{organization_id}/leads/{lead_id}")
def update_lead(organization_id: int, lead_id: int, lead_update: LeadUpdate, db: Session = Depends(get_db), _ = Depends(verify_organization_access)):
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.organization_id == organization_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    if lead_update.name is not None: lead.name = lead_update.name
    if lead_update.email is not None: lead.email = lead_update.email
    if lead_update.phone is not None: lead.phone = lead_update.phone
    if lead_update.source is not None: lead.source = lead_update.source
    if lead_update.notes is not None: lead.notes = lead_update.notes
    
    if lead_update.status is not None: 
        lead.status = lead_update.status
        # Calculate conversion time if moving to CONVERTED and it hasn't been set yet
        if lead.status == LeadStatusEnum.CONVERTED and lead.conversion_time_hours is None and lead.created_at:
            created_dt = lead.created_at.replace(tzinfo=None)
            lead.conversion_time_hours = round((datetime.utcnow() - created_dt).total_seconds() / 3600.0, 2)
            
    if lead_update.conversion_time_hours is not None: lead.conversion_time_hours = lead_update.conversion_time_hours
        
    db.commit()
    db.refresh(lead)
    return lead

@router.delete("/organizations/{organization_id}/leads/{lead_id}")
def delete_lead(organization_id: int, lead_id: int, db: Session = Depends(get_db), _ = Depends(verify_organization_access)):
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.organization_id == organization_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    db.delete(lead)
    db.commit()
    return {"status": "success"}
