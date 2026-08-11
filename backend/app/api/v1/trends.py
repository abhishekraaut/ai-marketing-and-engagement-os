from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.trend import Trend, TrendEvaluationResponse
from app.services.trends.trend_service import trend_service
from app.api.v1.auth import verify_organization_access, require_role
from app.models.enums import RoleEnum

router = APIRouter()

@router.get("/", response_model=List[Trend])
def get_trends(organization_id: int, _ = Depends(verify_organization_access)):
    """Get the current trending topics."""
    return trend_service.get_trends()

@router.post("/{trend_id}/evaluate", response_model=TrendEvaluationResponse)
async def evaluate_trend(
    organization_id: int,
    trend_id: str,
    db: Session = Depends(get_db),
    _ = Depends(require_role(RoleEnum.OWNER, RoleEnum.ADMIN, RoleEnum.EDITOR))
):
    """Evaluate how relevant a trend is to the organization's brand."""
    try:
        return await trend_service.evaluate_trend(db, organization_id, trend_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to evaluate trend")
