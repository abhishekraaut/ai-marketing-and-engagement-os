from typing import Optional, List
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.domain import ContentItem, PlatformVariant, AuditLog
from app.models.enums import ContentStatusEnum
from app.schemas.content import VariantUpdate

class ContentService:
    def get_content_item(self, db: Session, content_item_id: int, organization_id: int) -> ContentItem:
        # Join with campaign to verify organization ownership
        content_item = db.query(ContentItem).filter(
            ContentItem.id == content_item_id
        ).first()
        
        if not content_item or content_item.campaign.organization_id != organization_id:
            raise HTTPException(status_code=404, detail="Content not found")
        return content_item

    def get_variant(self, db: Session, content_item_id: int, variant_id: int, organization_id: int) -> PlatformVariant:
        variant = db.query(PlatformVariant).filter(
            PlatformVariant.id == variant_id,
            PlatformVariant.content_item_id == content_item_id
        ).first()
        
        if not variant or variant.content_item.campaign.organization_id != organization_id:
            raise HTTPException(status_code=404, detail="Variant not found")
        return variant

    def _log_audit(self, db: Session, org_id: int, action: str, entity_type: str, entity_id: int, metadata: dict = None):
        log = AuditLog(
            organization_id=org_id,
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id),
            metadata_=metadata or {}
        )
        db.add(log)

    def submit_review(self, db: Session, content_item_id: int, variant_id: int, organization_id: int) -> PlatformVariant:
        variant = self.get_variant(db, content_item_id, variant_id, organization_id)
        
        if variant.status not in [ContentStatusEnum.DRAFT, ContentStatusEnum.GENERATED, ContentStatusEnum.REJECTED]:
            raise HTTPException(status_code=400, detail=f"Cannot submit review from state {variant.status}")
            
        variant.status = ContentStatusEnum.IN_REVIEW
        self._log_audit(db, organization_id, "CONTENT_SUBMITTED_FOR_REVIEW", "PlatformVariant", variant.id, {"platform": variant.platform.value})
        
        db.commit()
        db.refresh(variant)
        return variant

    def approve(self, db: Session, content_item_id: int, variant_id: int, organization_id: int) -> PlatformVariant:
        variant = self.get_variant(db, content_item_id, variant_id, organization_id)
        
        if variant.status != ContentStatusEnum.IN_REVIEW:
            raise HTTPException(status_code=400, detail="Only content in IN_REVIEW can be approved")
            
        variant.status = ContentStatusEnum.APPROVED
        self._log_audit(db, organization_id, "CONTENT_APPROVED", "PlatformVariant", variant.id, {"platform": variant.platform.value})
        
        db.commit()
        db.refresh(variant)
        return variant

    def reject(self, db: Session, content_item_id: int, variant_id: int, organization_id: int, reason: str) -> PlatformVariant:
        variant = self.get_variant(db, content_item_id, variant_id, organization_id)
        
        if variant.status != ContentStatusEnum.IN_REVIEW:
            raise HTTPException(status_code=400, detail="Only content in IN_REVIEW can be rejected")
            
        variant.status = ContentStatusEnum.REJECTED
        self._log_audit(db, organization_id, "CONTENT_REJECTED", "PlatformVariant", variant.id, {"platform": variant.platform.value, "reason": reason})
        
        db.commit()
        db.refresh(variant)
        return variant

    def edit_variant(self, db: Session, content_item_id: int, variant_id: int, organization_id: int, data: VariantUpdate) -> PlatformVariant:
        variant = self.get_variant(db, content_item_id, variant_id, organization_id)
        
        # If it was approved, editing it moves it back to IN_REVIEW
        state_changed = False
        if variant.status == ContentStatusEnum.APPROVED:
            variant.status = ContentStatusEnum.IN_REVIEW
            state_changed = True
            
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(variant, key, value)
            
        self._log_audit(db, organization_id, "CONTENT_EDITED", "PlatformVariant", variant.id, {"platform": variant.platform.value, "state_reset": state_changed})
        
        db.commit()
        db.refresh(variant)
        return variant

content_service = ContentService()
