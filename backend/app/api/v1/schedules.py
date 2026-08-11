from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.schedule import ScheduleCreate, ScheduleResponse, CalendarEventResponse
from app.services.campaigns.scheduling_service import scheduling_service
from app.api.v1.auth import verify_organization_access, require_role
from app.models.enums import RoleEnum

router = APIRouter()

@router.post("/organizations/{organization_id}/content/variants/{variant_id}/schedule", response_model=ScheduleResponse)
def schedule_variant(organization_id: int, variant_id: int, data: ScheduleCreate, db: Session = Depends(get_db), _ = Depends(require_role(RoleEnum.OWNER, RoleEnum.ADMIN))):
    return scheduling_service.schedule_variant(db, organization_id, variant_id, data)

@router.get("/organizations/{organization_id}/calendar", response_model=List[CalendarEventResponse])
def get_calendar(organization_id: int, db: Session = Depends(get_db), _ = Depends(verify_organization_access)):
    return scheduling_service.get_calendar_events(db, organization_id)
