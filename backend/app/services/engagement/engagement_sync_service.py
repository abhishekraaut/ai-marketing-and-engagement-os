import logging
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.domain import SocialAccount, PublishedPost, EngagementItem, AuditLog
from app.models.enums import EngagementTypeEnum, ReplyStatusEnum
from app.services.connectors.mock.mock_connector import mock_connector
from app.services.engagement.sentiment_service import sentiment_service

logger = logging.getLogger(__name__)

class EngagementSyncService:
    def sync_organization_engagement(self, org_id: int):
        db = SessionLocal()
        try:
            posts = db.query(PublishedPost).join(SocialAccount).filter(SocialAccount.organization_id == org_id).all()
            sync_count = 0
            
            for post in posts:
                from app.services.connectors.factory import get_connector
                connector = get_connector(post.social_account.platform.value, access_token=post.social_account.access_token_encrypted, external_account_id=post.social_account.external_account_id)
                comments = connector.get_comments(post.external_post_id)
                for comment in comments:
                    ext_id = comment["external_engagement_id"]
                    
                    # Prevent duplicates
                    existing = db.query(EngagementItem).filter(
                        EngagementItem.external_id == ext_id,
                        EngagementItem.social_account_id == post.social_account_id
                    ).first()
                    
                    if existing:
                        continue
                        
                    # Classify
                    classification = sentiment_service.classify(comment["content"])
                    
                    item = EngagementItem(
                        published_post_id=post.id,
                        social_account_id=post.social_account_id,
                        external_id=ext_id,
                        type=EngagementTypeEnum.COMMENT,
                        author_name=comment["author_name"],
                        author_external_id=comment["author_handle"],
                        content=comment["content"],
                        sentiment=classification["sentiment"],
                        category=classification["category"],
                        reply_status=ReplyStatusEnum.PENDING
                    )
                    db.add(item)
                    sync_count += 1
            
            if sync_count > 0:
                log = AuditLog(
                    organization_id=org_id,
                    action="ENGAGEMENT_SYNC_COMPLETED",
                    entity_type="Organization",
                    entity_id=str(org_id),
                    metadata_={"items_synced": sync_count}
                )
                db.add(log)
            db.commit()
            return sync_count
        except Exception as e:
            db.rollback()
            logger.error(f"Error syncing engagement for org {org_id}: {e}")
            raise e
        finally:
            db.close()

engagement_sync_service = EngagementSyncService()
