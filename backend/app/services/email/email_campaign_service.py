import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.domain import EmailCampaign, AuditLog
from app.models import Organization
from app.models.enums import EmailCampaignStatusEnum
from app.services.email.mock_email_provider import mock_email_provider

logger = logging.getLogger(__name__)

class EmailCampaignService:
    def schedule_campaign(self, db: Session, email_id: int, scheduled_at: datetime) -> EmailCampaign:
        email = db.query(EmailCampaign).filter(EmailCampaign.id == email_id).first()
        if not email or email.status != EmailCampaignStatusEnum.APPROVED:
            raise ValueError("Email must be APPROVED before scheduling")
            
        email.scheduled_at = scheduled_at
        email.status = EmailCampaignStatusEnum.SCHEDULED
        
        db.add(AuditLog(
            organization_id=email.organization_id,
            action="EMAIL_CAMPAIGN_SCHEDULED",
            entity_type="EmailCampaign",
            entity_id=str(email.id)
        ))
        db.commit()
        return email

    def process_due_emails(self):
        db = SessionLocal()
        try:
            now = datetime.now(timezone.utc)
            due_emails = db.query(EmailCampaign).filter(
                EmailCampaign.status == EmailCampaignStatusEnum.SCHEDULED,
                EmailCampaign.scheduled_at <= now
            ).with_for_update(skip_locked=True).all()
            
            for email in due_emails:
                try:
                    self.send_email(db, email.id)
                except Exception as e:
                    logger.error(f"Failed to process scheduled email {email.id}: {e}")
        finally:
            db.close()

    def send_email(self, db: Session, email_id: int) -> EmailCampaign:
        email = db.query(EmailCampaign).filter(EmailCampaign.id == email_id).first()
        
        if email.status == EmailCampaignStatusEnum.SENT:
            return email # Idempotent
            
        if email.status not in [EmailCampaignStatusEnum.APPROVED, EmailCampaignStatusEnum.SCHEDULED]:
            raise ValueError("Email must be APPROVED or SCHEDULED before sending")
            
        email.status = EmailCampaignStatusEnum.SENDING
        db.commit()
        
        try:
            # We assume Audience contact_count gives us the recipient count
            recipients = email.audience.contact_count if email.audience else 100
            
            res = mock_email_provider.send_email(
                campaign_id=email.id,
                subject=email.subject,
                body=email.body,
                recipient_count=recipients
            )
            
            email.external_campaign_id = res["external_campaign_id"]
            email.recipient_count = res["recipient_count"]
            email.status = EmailCampaignStatusEnum.SENT
            email.sent_at = datetime.now(timezone.utc)
            
            db.add(AuditLog(
                organization_id=email.organization_id,
                action="EMAIL_CAMPAIGN_SENT",
                entity_type="EmailCampaign",
                entity_id=str(email.id)
            ))
            db.commit()
            return email
            
        except Exception as e:
            email.status = EmailCampaignStatusEnum.FAILED
            db.add(AuditLog(
                organization_id=email.organization_id,
                action="EMAIL_CAMPAIGN_FAILED",
                entity_type="EmailCampaign",
                entity_id=str(email.id)
            ))
            db.commit()
            raise e

email_campaign_service = EmailCampaignService()
