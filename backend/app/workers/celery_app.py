from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "ai_marketing_worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

# Automatically discover tasks in these packages
celery_app.autodiscover_tasks([
    'app.workers.tasks',
    'app.workers.publishing_tasks',
    'app.workers.analytics_tasks',
    'app.workers.engagement_tasks',
    'app.workers.email_tasks'
])

# Configure Celery Beat to run periodically
celery_app.conf.beat_schedule = {
    'check-due-schedules-every-minute': {
        'task': 'app.workers.publishing_tasks.check_due_schedules',
        'schedule': 60.0, # Every 60 seconds
    },
    'sync-analytics-every-5-minutes': {
        'task': 'app.workers.analytics_tasks.sync_analytics_task',
        'schedule': 300.0, # Every 5 minutes
    },
    'sync-engagement-every-5-minutes': {
        'task': 'app.workers.engagement_tasks.sync_engagement_task',
        'schedule': 300.0, # Every 5 minutes
    },
    'send-scheduled-emails-every-minute': {
        'task': 'app.workers.email_tasks.send_scheduled_email_campaigns_task',
        'schedule': 60.0, # Every 60 seconds
    }
}

celery_app.conf.task_routes = {
    "app.workers.celery_app.health_check_task": "main-queue"
}

@celery_app.task
def health_check_task():
    return {"status": "ok", "task": "health_check_task"}
