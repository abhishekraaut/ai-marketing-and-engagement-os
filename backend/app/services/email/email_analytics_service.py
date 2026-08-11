import hashlib
from sqlalchemy.orm import Session
from app.models.domain import EmailCampaign

class EmailAnalyticsService:
    def get_campaign_analytics(self, db: Session, email_id: int) -> dict:
        email = db.query(EmailCampaign).filter(EmailCampaign.id == email_id).first()
        if not email or email.status != "SENT":
            return {
                "recipient_count": 0,
                "delivered": 0,
                "opened": 0,
                "clicked": 0,
                "bounced": 0,
                "open_rate": 0.0,
                "click_rate": 0.0
            }
            
        recipients = email.recipient_count or 100
        
        # Deterministic generation using external_campaign_id
        ext_id = email.external_campaign_id or str(email.id)
        hash_val = int(hashlib.md5(ext_id.encode()).hexdigest()[:8], 16)
        
        delivered_pct = 0.95 + (hash_val % 5) / 100.0 # 95-99%
        open_pct = 0.35 + (hash_val % 20) / 100.0 # 35-54%
        click_pct = 0.10 + (hash_val % 10) / 100.0 # 10-19%
        
        delivered = int(recipients * delivered_pct)
        bounced = recipients - delivered
        opened = int(delivered * open_pct)
        clicked = int(opened * click_pct)
        
        return {
            "recipient_count": recipients,
            "delivered": delivered,
            "opened": opened,
            "clicked": clicked,
            "bounced": bounced,
            "open_rate": round(open_pct * 100, 2),
            "click_rate": round((clicked / delivered * 100) if delivered > 0 else 0, 2)
        }

email_analytics_service = EmailAnalyticsService()
