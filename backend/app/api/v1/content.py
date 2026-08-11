from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.content import RejectRequest, VariantUpdate, PlatformVariantResponse
from app.services.campaigns.content_service import content_service
from app.api.v1.auth import verify_organization_access, require_role
from app.models.enums import RoleEnum

router = APIRouter()

@router.post("/organizations/{organization_id}/content/{content_id}/variants/{variant_id}/submit-review", response_model=PlatformVariantResponse)
def submit_review(organization_id: int, content_id: int, variant_id: int, db: Session = Depends(get_db), _ = Depends(require_role(RoleEnum.OWNER, RoleEnum.ADMIN, RoleEnum.EDITOR))):
    return content_service.submit_review(db, content_id, variant_id, organization_id)

@router.post("/organizations/{organization_id}/content/{content_id}/variants/{variant_id}/approve", response_model=PlatformVariantResponse)
def approve(organization_id: int, content_id: int, variant_id: int, db: Session = Depends(get_db), _ = Depends(require_role(RoleEnum.OWNER, RoleEnum.ADMIN))):
    return content_service.approve(db, content_id, variant_id, organization_id)

@router.post("/organizations/{organization_id}/content/{content_id}/variants/{variant_id}/reject", response_model=PlatformVariantResponse)
def reject(organization_id: int, content_id: int, variant_id: int, request: RejectRequest, db: Session = Depends(get_db), _ = Depends(require_role(RoleEnum.OWNER, RoleEnum.ADMIN))):
    return content_service.reject(db, content_id, variant_id, organization_id, request.reason)

@router.patch("/organizations/{organization_id}/content/{content_id}/variants/{variant_id}", response_model=PlatformVariantResponse)
def edit_variant(organization_id: int, content_id: int, variant_id: int, data: VariantUpdate, db: Session = Depends(get_db), _ = Depends(require_role(RoleEnum.OWNER, RoleEnum.ADMIN))):
    return content_service.edit_variant(db, content_id, variant_id, organization_id, data)
