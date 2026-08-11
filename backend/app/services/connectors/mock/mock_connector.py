from app.services.connectors.base import SocialConnector

class MockSocialConnector(SocialConnector):
    def connect_account(self) -> dict:
        return {
            "account_id": "mock_acc_12345",
            "account_name": "Mock Account",
            "access_token": "mock_access_token",
            "refresh_token": "mock_refresh_token"
        }

    def refresh_token(self, refresh_token: str) -> dict:
        return {"access_token": "new_mock_access_token"}

    def publish_post(self, content: str, media_urls: list = None, account_name: str = None) -> dict:
        import uuid
        import datetime
        from datetime import timezone

        # Simulate permanent failure for disconnected accounts or invalid states
        if account_name == "ERROR":
            return {"success": False, "permanent": True, "error": "Account is invalid"}
            
        # Simulate temporary failure if "TIMEOUT" is in content
        if "TIMEOUT" in content:
            return {"success": False, "permanent": False, "error": "Network timeout"}
            
        post_id = f"mock_{uuid.uuid4().hex[:8]}"
        return {
            "success": True, 
            "external_post_id": post_id, 
            "url": f"https://mock.social/{post_id}",
            "published_at": datetime.datetime.now(timezone.utc).isoformat()
        }

    def get_post(self, post_id: str) -> dict:
        return {"content": "mock content"}

    def get_analytics(self, post_id: str) -> dict:
        return {"likes": 100, "comments": 10}

    def get_comments(self, post_id: str) -> list:
        return []

    def reply_to_comment(self, comment_id: str, content: str) -> dict:
        return {"reply_id": "mock_reply"}

mock_connector = MockSocialConnector()
