import logging
from celery import shared_task
from app.services.analytics.analytics_sync_service import analytics_sync_service
from app.db.session import SessionLocal
from app.models.domain import Organization

logger = logging.getLogger(__name__)

@shared_task
def sync_analytics_task():
    db = SessionLocal()
    try:
        orgs = db.query(Organization).all()
        for org in orgs:
            try:
                synced = analytics_sync_service.sync_organization_analytics(org.id)
                logger.info(f"Synced {synced} posts for org {org.id}")
            except Exception as e:
                logger.error(f"Error syncing analytics for org {org.id}: {e}")
    finally:
        db.close()
