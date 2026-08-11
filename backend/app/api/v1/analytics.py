from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.analytics.analytics_aggregator import analytics_aggregator
from app.services.analytics.recommendation_service import recommendation_service
from app.services.analytics.analytics_sync_service import analytics_sync_service
from app.api.v1.auth import verify_organization_access, require_role
from app.models.enums import RoleEnum

router = APIRouter()

@router.get("/organizations/{organization_id}/analytics/overview")
def get_overview(organization_id: int, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None, platform: Optional[str] = None, db: Session = Depends(get_db), _ = Depends(verify_organization_access)):
    return analytics_aggregator.get_overview(db, organization_id, start_date, end_date, platform)

@router.get("/organizations/{organization_id}/analytics/trends")
def get_trends(organization_id: int, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None, db: Session = Depends(get_db), _ = Depends(verify_organization_access)):
    return analytics_aggregator.get_trends(db, organization_id, start_date, end_date)

@router.get("/organizations/{organization_id}/analytics/platforms")
def get_platforms(organization_id: int, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None, db: Session = Depends(get_db), _ = Depends(verify_organization_access)):
    return analytics_aggregator.get_platform_performance(db, organization_id, start_date, end_date)

@router.get("/organizations/{organization_id}/analytics/top-content")
def get_top_content(organization_id: int, db: Session = Depends(get_db), _ = Depends(verify_organization_access)):
    return analytics_aggregator.get_top_content(db, organization_id)

@router.get("/organizations/{organization_id}/analytics/recommendations")
def get_recommendations(organization_id: int, db: Session = Depends(get_db), _ = Depends(verify_organization_access)):
    return recommendation_service.get_recommendations(db, organization_id)

@router.post("/organizations/{organization_id}/analytics/sync")
def sync_analytics(organization_id: int, _ = Depends(verify_organization_access)):
    # This manually triggers the sync service immediately (useful for UX)
    synced = analytics_sync_service.sync_organization_analytics(organization_id)
    return {"status": "success", "synced_posts": synced}
