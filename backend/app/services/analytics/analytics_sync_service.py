import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.domain import PublishedPost, AnalyticsSnapshot, AuditLog, SocialAccount
from app.models.enums import PublishedPostStatusEnum
from app.services.connectors.factory import get_connector

logger = logging.getLogger(__name__)

class AnalyticsSyncService:
    def sync_organization_analytics(self, org_id: int):
        db = SessionLocal()
        try:
            sync_count = 0
            today = datetime.now(timezone.utc).date()
            
            # --- 1. Sync Page-Level Analytics ---
            accounts = db.query(SocialAccount).filter(SocialAccount.organization_id == org_id).all()
            for account in accounts:
                try:
                    connector = get_connector(account.platform.value, access_token=account.access_token_encrypted, external_account_id=account.external_account_id)
                    # We expect get_page_analytics to return followers, reach, etc.
                    page_metrics = connector.get_page_analytics() if hasattr(connector, 'get_page_analytics') else {}
                    
                    if page_metrics:
                        existing_page_snap = db.query(AnalyticsSnapshot).filter(
                            AnalyticsSnapshot.published_post_id == None,
                            AnalyticsSnapshot.platform == account.platform,
                            AnalyticsSnapshot.organization_id == org_id
                        ).order_by(AnalyticsSnapshot.snapshot_date.desc()).first()
                        
                        if existing_page_snap and existing_page_snap.snapshot_date.date() == today:
                            existing_page_snap.followers = page_metrics.get("followers", existing_page_snap.followers)
                            existing_page_snap.reach = page_metrics.get("page_reach", existing_page_snap.reach)
                            existing_page_snap.impressions = page_metrics.get("page_impressions", existing_page_snap.impressions)
                            existing_page_snap.snapshot_date = datetime.now(timezone.utc)
                        else:
                            page_snap = AnalyticsSnapshot(
                                organization_id=org_id,
                                platform=account.platform,
                                snapshot_date=datetime.now(timezone.utc),
                                followers=page_metrics.get("followers", 0),
                                reach=page_metrics.get("page_reach", 0),
                                impressions=page_metrics.get("page_impressions", 0)
                            )
                            db.add(page_snap)
                except Exception as e:
                    logger.error(f"Error syncing page analytics for account {account.id}: {e}")

            # --- 2. Sync Post-Level Analytics ---
            posts = db.query(PublishedPost).filter(
                PublishedPost.status == PublishedPostStatusEnum.PUBLISHED
            ).all()
            org_posts = [p for p in posts if p.social_account.organization_id == org_id]

            for post in org_posts:
                try:
                    existing = db.query(AnalyticsSnapshot).filter(
                        AnalyticsSnapshot.published_post_id == post.id,
                        AnalyticsSnapshot.organization_id == org_id
                    ).order_by(AnalyticsSnapshot.snapshot_date.desc()).first()

                    platform_name = post.social_account.platform.value
                    connector = get_connector(platform_name, access_token=post.social_account.access_token_encrypted, external_account_id=post.social_account.external_account_id)
                    
                    metrics = connector.get_analytics(
                        post_id=post.external_post_id,
                        platform_name=platform_name
                    )

                    if existing and existing.snapshot_date.date() == today:
                        existing.impressions = metrics.get("impressions", 0)
                        existing.reach = metrics.get("reach", 0)
                        existing.likes = metrics.get("likes", 0)
                        existing.comments = metrics.get("comments", 0)
                        existing.shares = metrics.get("shares", 0)
                        existing.clicks = metrics.get("clicks", 0)
                        existing.engagement_rate = metrics.get("engagement_rate", 0.0)
                        existing.snapshot_date = datetime.now(timezone.utc)
                        sync_count += 1
                    else:
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
                except Exception as e:
                    logger.error(f"Error syncing post analytics for post {post.id}: {e}")

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
