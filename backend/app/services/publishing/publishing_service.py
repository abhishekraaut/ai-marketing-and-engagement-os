from datetime import datetime, timezone
import logging
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.domain import Schedule, PlatformVariant, ContentItem, SocialAccount, PublishedPost, AuditLog
from app.models.enums import ScheduleStatusEnum, ContentStatusEnum, PublishedPostStatusEnum, SocialAccountStatusEnum
from app.services.connectors.mock.mock_connector import mock_connector

logger = logging.getLogger(__name__)

class PublishingService:
    def _log_audit(self, db: Session, org_id: int, action: str, entity_type: str, entity_id: int, metadata: dict = None):
        log = AuditLog(
            organization_id=org_id,
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id),
            metadata_=metadata or {}
        )
        db.add(log)

    def publish_scheduled_post(self, schedule_id: int):
        """
        Executes a schedule, calling the connector, ensuring idempotency.
        This is intended to be called from a Celery worker.
        """
        db = SessionLocal()
        try:
            # 1. Load Schedule with lock (basic idempotency in PG, though SKIP LOCKED is done upstream)
            schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
            if not schedule:
                logger.error(f"Schedule {schedule_id} not found")
                return

            if schedule.status in [ScheduleStatusEnum.PUBLISHED, ScheduleStatusEnum.CANCELLED]:
                logger.info(f"Schedule {schedule_id} is already {schedule.status}. Skipping.")
                return

            # Check if PublishedPost already exists (Idempotency)
            existing_post = db.query(PublishedPost).filter(PublishedPost.schedule_id == schedule_id).first()
            if existing_post and existing_post.status == PublishedPostStatusEnum.PUBLISHED:
                logger.info(f"PublishedPost already exists for Schedule {schedule_id}. Skipping.")
                if schedule.status != ScheduleStatusEnum.PUBLISHED:
                    schedule.status = ScheduleStatusEnum.PUBLISHED
                    db.commit()
                return

            variant = schedule.platform_variant
            content_item = variant.content_item
            org_id = content_item.campaign.organization_id

            if variant.status != ContentStatusEnum.SCHEDULED:
                logger.error(f"Variant {variant.id} is not SCHEDULED. Currently {variant.status}")
                self._handle_permanent_failure(db, schedule, existing_post, org_id, "Variant not in SCHEDULED state")
                return

            # Find social account
            account = db.query(SocialAccount).filter(
                SocialAccount.organization_id == org_id,
                SocialAccount.platform == variant.platform
            ).first()

            if not account or account.status != SocialAccountStatusEnum.CONNECTED:
                self._handle_permanent_failure(db, schedule, existing_post, org_id, "Social account not connected")
                return

            # Call Mock Connector
            self._log_audit(db, org_id, "POST_PUBLISH_STARTED", "Schedule", schedule.id)
            
            from app.services.connectors.factory import get_connector
            connector = get_connector(account.platform.value)
            
            connector_res = connector.publish_post(
                content=variant.content,
                media_urls=variant.media_urls,
                account_name=account.account_name if account.account_name != "ERROR" else "ERROR"
            )

            if connector_res.get("success"):
                self._handle_success(db, schedule, variant, account, existing_post, org_id, connector_res)
            else:
                if connector_res.get("permanent"):
                    self._handle_permanent_failure(db, schedule, existing_post, org_id, connector_res.get("error"))
                else:
                    raise Exception(f"Temporary failure: {connector_res.get('error')}") # Trigger celery retry

        except Exception as e:
            db.rollback()
            raise e
        finally:
            db.close()

    def _handle_success(self, db: Session, schedule: Schedule, variant: PlatformVariant, account: SocialAccount, existing_post: PublishedPost, org_id: int, res: dict):
        if not existing_post:
            post = PublishedPost(
                platform_variant_id=variant.id,
                schedule_id=schedule.id,
                social_account_id=account.id,
                external_post_id=res["external_post_id"],
                published_at=datetime.fromisoformat(res["published_at"]),
                url=res["url"],
                status=PublishedPostStatusEnum.PUBLISHED,
                metadata_={"provider_response": "Mock success"}
            )
            db.add(post)
        else:
            existing_post.status = PublishedPostStatusEnum.PUBLISHED
            existing_post.external_post_id = res["external_post_id"]
            existing_post.url = res["url"]
            existing_post.published_at = datetime.fromisoformat(res["published_at"])
            post = existing_post

        schedule.status = ScheduleStatusEnum.PUBLISHED
        variant.status = ContentStatusEnum.PUBLISHED
        
        # Check if all variants are published to mark ContentItem as published
        all_variants = db.query(PlatformVariant).filter(PlatformVariant.content_item_id == variant.content_item_id).all()
        if all(v.status == ContentStatusEnum.PUBLISHED for v in all_variants):
            variant.content_item.status = ContentStatusEnum.PUBLISHED

        db.flush()
        self._log_audit(db, org_id, "POST_PUBLISHED", "PublishedPost", post.id, {"schedule_id": schedule.id, "platform": variant.platform.value})
        db.commit()

    def _handle_permanent_failure(self, db: Session, schedule: Schedule, existing_post: PublishedPost, org_id: int, reason: str):
        schedule.status = ScheduleStatusEnum.FAILED
        if not existing_post:
            post = PublishedPost(
                schedule_id=schedule.id,
                social_account_id=1, # Fallback, ideally we'd know which one
                status=PublishedPostStatusEnum.FAILED,
                metadata_={"failure_reason": reason}
            )
            db.add(post)
            db.flush()
            post_id = post.id
        else:
            existing_post.status = PublishedPostStatusEnum.FAILED
            existing_post.metadata_ = {"failure_reason": reason}
            post_id = existing_post.id

        self._log_audit(db, org_id, "POST_PUBLISH_FAILED", "Schedule", schedule.id, {"reason": reason})
        db.commit()

publishing_service = PublishingService()
