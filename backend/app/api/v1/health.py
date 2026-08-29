from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db

router = APIRouter()

@router.get("/")
def health_check():
    return {"status": "ok", "service": "ai-marketing-api"}

@router.get("/db")
def health_check_db(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "service": "ai-marketing-api-db"}
    except Exception as e:
        return {"status": "error", "detail": str(e)}

@router.get("/celery")
def health_check_celery():
    try:
        from app.workers.celery_app import celery_app
        # This will ping celery workers or at least check redis connection
        i = celery_app.control.inspect()
        active = i.active() if i else None
        if active is None:
            return {"status": "inactive"}
        return {"status": "active", "workers": len(active)}
    except Exception:
        return {"status": "inactive"}
