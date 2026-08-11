import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.domain import PublishedPost, AnalyticsSnapshot, AuditLog
from app.models.enums import PublishedPostStatusEnum
from app.services.connectors.factory import get_connector

logger = logging.getLogger(__name__)

class AnalyticsSyncService:
    def sync_organization_analytics(self, org_id: int):
        db = SessionLocal()
        try:
            posts = db.query(PublishedPost).filter(
                PublishedPost.status == PublishedPostStatusEnum.PUBLISHED
            ).all()

            # Filter for just this org's posts
            org_posts = [p for p in posts if p.social_account.organization_id == org_id]
            
            today = datetime.now(timezone.utc).date()
            sync_count = 0

            for post in org_posts:
                # Basic idempotency check for today
                # In a real app we'd query precisely on the date or use an upsert
                existing = db.query(AnalyticsSnapshot).filter(
                    AnalyticsSnapshot.published_post_id == post.id,
                    AnalyticsSnapshot.organization_id == org_id
                ).order_by(AnalyticsSnapshot.snapshot_date.desc()).first()

                if existing and existing.snapshot_date.date() == today:
                    continue # Already synced today

                platform_name = post.social_account.platform.value
                connector = get_connector(platform_name)
                
                metrics = connector.get_analytics(
                    post_id=post.external_post_id,
                    platform_name=platform_name
                )

                snapshot = AnalyticsSnapshot(
                    organization_id=org_id,
                    campaign_id=post.schedule.platform_variant.content_item.campaign_id,
                    published_post_id=post.id,
                    platform=post.social_account.platform,
                    snapshot_date=datetime.now(timezone.utc),
                    impressions=metrics.get("impressions", 0),
                    reach=metrics.get("reach", 0),
                    likes=metrics.get("likes", 0),
                    comments=metrics.get("comments", 0),
                    shares=metrics.get("shares", 0),
                    clicks=metrics.get("clicks", 0),
                    engagement_rate=metrics.get("engagement_rate", 0.0),
                )
                db.add(snapshot)
                sync_count += 1

            if sync_count > 0:
                log = AuditLog(
                    organization_id=org_id,
                    action="ANALYTICS_SYNC_COMPLETED",
                    entity_type="Organization",
                    entity_id=str(org_id),
                    metadata_={"posts_synced": sync_count}
                )
                db.add(log)

            db.commit()
            return sync_count
        except Exception as e:
            db.rollback()
            logger.error(f"Error syncing analytics for org {org_id}: {e}")
            raise e
        finally:
            db.close()

analytics_sync_service = AnalyticsSyncService()
