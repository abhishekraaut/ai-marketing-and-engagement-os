import logging
from celery import shared_task
from app.services.engagement.engagement_sync_service import engagement_sync_service
from app.db.session import SessionLocal
from app.models.user import Organization

logger = logging.getLogger(__name__)

@shared_task
def sync_engagement_task():
    db = SessionLocal()
    try:
        orgs = db.query(Organization).all()
        for org in orgs:
            try:
                synced = engagement_sync_service.sync_organization_engagement(org.id)
                logger.info(f"Synced {synced} engagements for org {org.id}")
            except Exception as e:
                logger.error(f"Error syncing engagement for org {org.id}: {e}")
    finally:
        db.close()
