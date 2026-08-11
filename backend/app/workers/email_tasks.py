import logging
from celery import shared_task
from app.services.email.email_campaign_service import email_campaign_service

logger = logging.getLogger(__name__)

@shared_task
def send_scheduled_email_campaigns_task():
    try:
        email_campaign_service.process_due_emails()
    except Exception as e:
        logger.error(f"Error processing due emails: {e}")
