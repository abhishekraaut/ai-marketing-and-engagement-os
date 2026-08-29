@echo off
echo ========================================================
echo Starting Celery Workers on Windows
echo ========================================================
echo Make sure Redis is running! (e.g. docker run -p 6379:6379 -d redis)
echo.

echo Starting Celery Worker (using --pool=solo for Windows compatibility)...
start cmd /k ".\venv\Scripts\activate && celery -A app.workers.celery_app worker --pool=solo --loglevel=info"

echo Starting Celery Beat Scheduler...
start cmd /k ".\venv\Scripts\activate && celery -A app.workers.celery_app beat --loglevel=info"

echo Workers started in new windows!
