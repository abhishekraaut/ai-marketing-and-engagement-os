from datetime import datetime, timezone
import logging
from sqlalchemy.orm import Session
from celery import shared_task
from app.db.session import SessionLocal
from app.models.domain import Schedule
from app.models.enums import ScheduleStatusEnum
from app.services.publishing.publishing_service import publishing_service

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def publish_post_task(self, schedule_id: int):
    try:
        publishing_service.publish_scheduled_post(schedule_id)
    except Exception as exc:
        logger.error(f"Error publishing schedule {schedule_id}: {exc}")
        raise self.retry(exc=exc)

@shared_task
def check_due_schedules():
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        
        # We find SCHEDULED tasks that are due, lock them, and move them to PROCESSING
        schedules = db.query(Schedule).filter(
            Schedule.status == ScheduleStatusEnum.SCHEDULED,
            Schedule.scheduled_at <= now
        ).with_for_update(skip_locked=True).all()

        for schedule in schedules:
            schedule.status = ScheduleStatusEnum.PROCESSING
            publish_post_task.delay(schedule.id)
            
        db.commit()
    except Exception as e:
        logger.error(f"Error checking due schedules: {e}")
        db.rollback()
    finally:
        db.close()
