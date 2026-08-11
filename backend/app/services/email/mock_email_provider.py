import uuid
import hashlib

class MockEmailProvider:
    def send_email(self, campaign_id: int, subject: str, body: str, recipient_count: int) -> dict:
        """
        Simulates sending an email campaign.
        Deterministically fails if "ERROR" is in subject.
        """
        if "ERROR" in (subject or "").upper():
            raise Exception("Mock email provider error triggered by subject")
            
        ext_id = f"mock_email_{uuid.uuid4().hex[:8]}"
        
        return {
            "success": True,
            "external_campaign_id": ext_id,
            "recipient_count": recipient_count
        }

mock_email_provider = MockEmailProvider()
