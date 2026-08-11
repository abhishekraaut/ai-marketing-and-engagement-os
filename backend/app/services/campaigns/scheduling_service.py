from typing import List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.domain import Schedule, PlatformVariant, ContentItem, Campaign, SocialAccount, AuditLog
from app.models.enums import ScheduleStatusEnum, ContentStatusEnum
from app.schemas.schedule import ScheduleCreate, CalendarEventResponse

class SchedulingService:
    def _log_audit(self, db: Session, org_id: int, action: str, entity_type: str, entity_id: int, metadata: dict = None):
        log = AuditLog(
            organization_id=org_id,
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id),
            metadata_=metadata or {}
        )
        db.add(log)

    def schedule_variant(self, db: Session, organization_id: int, variant_id: int, data: ScheduleCreate) -> Schedule:
        # 1. Verify variant exists and is approved
        variant = db.query(PlatformVariant).join(ContentItem).join(Campaign).filter(
            PlatformVariant.id == variant_id,
            Campaign.organization_id == organization_id
        ).first()

        if not variant:
            raise HTTPException(status_code=404, detail="Variant not found")
            
        if variant.status != ContentStatusEnum.APPROVED:
            raise HTTPException(status_code=400, detail="Only approved variants can be scheduled")

        # 2. Verify time is in future
        if data.scheduled_at <= datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Scheduled time must be in the future")

        # 3. Verify social account
        account = db.query(SocialAccount).filter(
            SocialAccount.id == data.social_account_id,
            SocialAccount.organization_id == organization_id,
            SocialAccount.platform == variant.platform
        ).first()

        if not account:
            raise HTTPException(status_code=400, detail="Invalid social account for this platform")

        # 4. Check for existing active schedules for this variant
        existing = db.query(Schedule).filter(
            Schedule.platform_variant_id == variant.id,
            Schedule.status.in_([ScheduleStatusEnum.SCHEDULED, ScheduleStatusEnum.PROCESSING])
        ).first()

        if existing:
            raise HTTPException(status_code=400, detail="Variant is already scheduled")

        schedule = Schedule(
            platform_variant_id=variant.id,
            scheduled_at=data.scheduled_at,
            timezone=data.timezone,
            status=ScheduleStatusEnum.SCHEDULED
        )
        db.add(schedule)
        
        variant.status = ContentStatusEnum.SCHEDULED
        
        self._log_audit(db, organization_id, "POST_SCHEDULED", "Schedule", schedule.id, {"variant_id": variant.id})
        
        db.commit()
        db.refresh(schedule)
        return schedule

    def get_calendar_events(self, db: Session, organization_id: int) -> List[CalendarEventResponse]:
        schedules = db.query(Schedule, PlatformVariant, ContentItem, Campaign).select_from(Schedule).join(PlatformVariant).join(ContentItem).join(Campaign).filter(
            Campaign.organization_id == organization_id
        ).all()
        
        events = []
        for sched, var, content, camp in schedules:
            events.append(CalendarEventResponse(
                schedule_id=sched.id,
                campaign_id=camp.id,
                content_item_id=content.id,
                platform_variant_id=var.id,
                platform=var.platform.value,
                title=content.title,
                content=var.content,
                caption=var.caption,
                scheduled_at=sched.scheduled_at,
                timezone=sched.timezone,
                status=sched.status.value
            ))
        return events

scheduling_service = SchedulingService()
