from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.content import RejectRequest, VariantUpdate, PlatformVariantResponse
from app.services.campaigns.content_service import content_service
from app.api.v1.auth import verify_organization_access, require_role
from app.models.enums import RoleEnum, PlatformEnum, PublishedPostStatusEnum
from app.models.domain import PublishedPost, SocialAccount
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

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

class PublishRequest(BaseModel):
    title: str
    body: str
    platforms: list[PlatformEnum]
    account_ids: list[int]
    media_url: Optional[str] = None
    is_reel: bool = False

@router.post("/organizations/{organization_id}/content/publish")
def publish_content(organization_id: int, req: PublishRequest, db: Session = Depends(get_db), _ = Depends(require_role(RoleEnum.OWNER, RoleEnum.ADMIN, RoleEnum.EDITOR))):
    posts = []
    for acc_id in req.account_ids:
        acc = db.query(SocialAccount).filter(SocialAccount.id == acc_id, SocialAccount.organization_id == organization_id).first()
        if not acc:
            continue
        
        post = PublishedPost(
            organization_id=organization_id,
            social_account_id=acc.id,
            content={"title": req.title, "body": req.body, "media_url": req.media_url, "is_reel": req.is_reel},
            external_id=f"mock_{datetime.now().timestamp()}",
            post_url=f"https://{acc.platform.value.lower()}.com/mock_post",
            status=PublishedPostStatusEnum.PUBLISHED,
            published_at=datetime.utcnow()
        )
        db.add(post)
        db.commit()
        db.refresh(post)
        posts.append(post)
    
    return {"status": "success", "published_count": len(posts)}

