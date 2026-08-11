from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.domain import Campaign, ContentItem, PlatformVariant, AuditLog
from app.models.user import Organization
from app.schemas.campaign import CampaignCreate, CampaignUpdate
from app.models.enums import ContentTypeEnum, ContentStatusEnum, PlatformEnum
from app.services.ai.orchestrator import ai_orchestrator

class CampaignService:
    def get_campaigns(self, db: Session, organization_id: int) -> List[Campaign]:
        return db.query(Campaign).filter(Campaign.organization_id == organization_id).all()

    def get_campaign(self, db: Session, campaign_id: int, organization_id: int) -> Optional[Campaign]:
        campaign = db.query(Campaign).filter(
            Campaign.id == campaign_id, 
            Campaign.organization_id == organization_id
        ).first()
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
        return campaign

    def create_campaign(self, db: Session, organization_id: int, campaign_in: CampaignCreate) -> Campaign:
        org = db.query(Organization).filter(Organization.id == organization_id).first()
        if not org:
            raise HTTPException(status_code=404, detail="Organization not found")
            
        db_campaign = Campaign(**campaign_in.model_dump(), organization_id=organization_id)
        db.add(db_campaign)
        db.commit()
        db.refresh(db_campaign)
        return db_campaign

    def update_campaign(self, db: Session, campaign_id: int, organization_id: int, campaign_in: CampaignUpdate) -> Campaign:
        db_campaign = self.get_campaign(db, campaign_id, organization_id)
        
        update_data = campaign_in.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_campaign, key, value)
            
        db.commit()
        db.refresh(db_campaign)
        return db_campaign

    async def generate_campaign_content(self, db: Session, campaign_id: int, organization_id: int, platforms: List[str]) -> dict:
        # Validate campaign
        campaign = self.get_campaign(db, campaign_id, organization_id)
        
        try:
            # Generate via AI Orchestrator
            ai_result = await ai_orchestrator.generate_campaign_content(
                db=db,
                organization_id=organization_id,
                campaign_id=campaign_id,
                platforms=platforms
            )
        except ValueError as e:
            if "Brand Profile must be configured" in str(e):
                raise HTTPException(status_code=400, detail=str(e))
            raise HTTPException(status_code=422, detail=str(e))
        except RuntimeError as e:
            raise HTTPException(status_code=502, detail=str(e))

        # Begin transaction to save content
        try:
            # Create ContentItem container
            content_item = ContentItem(
                campaign_id=campaign_id,
                content_type=ContentTypeEnum.SOCIAL,
                title="AI Generated Content",
                base_content=ai_result.campaign_summary,
                status=ContentStatusEnum.DRAFT,
                ai_score=0.0 # Calculate average later if needed
            )
            db.add(content_item)
            db.flush() # flush to get content_item.id

            variants_out = []
            for v in ai_result.variants:
                platform_enum = getattr(PlatformEnum, v.platform.upper(), None)
                if not platform_enum:
                    continue # Skip invalid platforms
                    
                variant = PlatformVariant(
                    content_item_id=content_item.id,
                    platform=platform_enum,
                    content=v.content,
                    hashtags=v.hashtags,
                    ai_score=float(v.engagement_score),
                    status=ContentStatusEnum.DRAFT
                )
                db.add(variant)
                variants_out.append({
                    "platform": v.platform,
                    "title": v.title,
                    "content": v.content,
                    "caption": v.caption,
                    "cta": v.cta,
                    "hashtags": v.hashtags,
                    "engagement_score": v.engagement_score
                })
            
            # Audit Log
            audit_log = AuditLog(
                organization_id=organization_id,
                action="CONTENT_GENERATED",
                entity_type="ContentItem",
                entity_id=str(content_item.id),
                metadata_info={"platforms": platforms}
            )
            db.add(audit_log)

            db.commit()
            
            return {
                "content_item_id": content_item.id,
                "summary": ai_result.campaign_summary,
                "variants": variants_out
            }

        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail="Database transaction failed during content save.")

campaign_service = CampaignService()
