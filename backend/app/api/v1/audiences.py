from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import csv
import io
from fastapi.responses import StreamingResponse

from app.db.session import get_db
from app.models.domain import Audience
from app.api.v1.auth import verify_organization_access

router = APIRouter()

class AudienceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    criteria: Optional[dict] = None

class AudienceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    criteria: Optional[dict] = None

@router.get("/organizations/{organization_id}/audiences")
def list_audiences(organization_id: int, db: Session = Depends(get_db), _ = Depends(verify_organization_access)):
    return db.query(Audience).filter(Audience.organization_id == organization_id).all()

@router.post("/organizations/{organization_id}/audiences")
def create_audience(organization_id: int, audience: AudienceCreate, db: Session = Depends(get_db), _ = Depends(verify_organization_access)):
    new_audience = Audience(organization_id=organization_id, name=audience.name, description=audience.description, criteria=audience.criteria, contact_count=0)
    db.add(new_audience)
    db.commit()
    db.refresh(new_audience)
    return new_audience

@router.put("/organizations/{organization_id}/audiences/{audience_id}")
def update_audience(organization_id: int, audience_id: int, audience_update: AudienceUpdate, db: Session = Depends(get_db), _ = Depends(verify_organization_access)):
    audience = db.query(Audience).filter(Audience.id == audience_id, Audience.organization_id == organization_id).first()
    if not audience:
        raise HTTPException(status_code=404, detail="Audience not found")
    
    if audience_update.name is not None:
        audience.name = audience_update.name
    if audience_update.description is not None:
        audience.description = audience_update.description
    if audience_update.criteria is not None:
        audience.criteria = audience_update.criteria
        
    db.commit()
    db.refresh(audience)
    return audience

@router.delete("/organizations/{organization_id}/audiences/{audience_id}")
def delete_audience(organization_id: int, audience_id: int, db: Session = Depends(get_db), _ = Depends(verify_organization_access)):
    audience = db.query(Audience).filter(Audience.id == audience_id, Audience.organization_id == organization_id).first()
    if not audience:
        raise HTTPException(status_code=404, detail="Audience not found")
    db.delete(audience)
    db.commit()
    return {"status": "success"}

@router.get("/organizations/{organization_id}/audiences/export")
def export_audiences(organization_id: int, db: Session = Depends(get_db), _ = Depends(verify_organization_access)):
    audiences = db.query(Audience).filter(Audience.organization_id == organization_id).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Name", "Description", "Contact Count", "Created At"])
    for aud in audiences:
        writer.writerow([aud.id, aud.name, aud.description, aud.contact_count, aud.created_at])
    
    response = StreamingResponse(iter([output.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=audiences_export.csv"
    return response
