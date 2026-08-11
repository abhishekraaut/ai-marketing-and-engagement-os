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
    'app.workers.publishing_tasks'
])

# Configure Celery Beat to run periodically
celery_app.conf.beat_schedule = {
    'check-due-schedules-every-minute': {
        'task': 'app.workers.publishing_tasks.check_due_schedules',
        'schedule': 60.0, # Every 60 seconds
    },
}

celery_app.conf.task_routes = {
    "app.workers.celery_app.health_check_task": "main-queue"
}

@celery_app.task
def health_check_task():
    return {"status": "ok", "task": "health_check_task"}
