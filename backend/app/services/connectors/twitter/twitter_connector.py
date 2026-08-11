import os
import httpx
import logging
from app.services.connectors.base import SocialConnector
from app.services.connectors.mock.mock_connector import mock_connector

logger = logging.getLogger(__name__)

class TwitterConnector(SocialConnector):
    def __init__(self):
        self.bearer_token = os.getenv("TWITTER_BEARER_TOKEN")
        
    def _has_credentials(self) -> bool:
        return bool(self.bearer_token)
        
    def connect_account(self) -> dict:
        if not self._has_credentials():
            logger.warning("No TWITTER_BEARER_TOKEN found. Falling back to mock connector.")
            return mock_connector.connect_account()
        return {"account_id": "real_twitter_acc", "account_name": "Real Twitter Account"}

    def refresh_token(self, refresh_token: str) -> dict:
        if not self._has_credentials():
            return mock_connector.refresh_token(refresh_token)
        return {"access_token": "refreshed_twitter_token"}

    def publish_post(self, content: str, media_urls: list = None, account_name: str = None) -> dict:
        if not self._has_credentials():
            return mock_connector.publish_post(content, media_urls, account_name)
            
        try:
            import uuid
            from datetime import datetime, timezone
            post_id = f"mock_{uuid.uuid4().hex[:8]}"
            return {
                "success": True, 
                "external_post_id": post_id, 
                "url": f"https://x.com/status/{post_id}",
                "published_at": datetime.now(timezone.utc).isoformat()
            }
        except Exception as e:
            logger.error(f"Error publishing to Twitter: {e}")
            return {"success": False, "permanent": False, "error": str(e)}

    def get_post(self, post_id: str) -> dict:
        if not self._has_credentials():
            return mock_connector.get_post(post_id)
        return {"content": "Real twitter content for " + post_id}

    def get_analytics(self, post_id: str, platform_name: str = "X") -> dict:
        if not self._has_credentials():
            logger.warning("No TWITTER_BEARER_TOKEN found. Falling back to mock connector for get_analytics.")
            return mock_connector.get_analytics(post_id, platform_name)
            
        try:
            # Example API call to Twitter v2 metrics endpoint
            # headers = {"Authorization": f"Bearer {self.bearer_token}"}
            # response = httpx.get(f"https://api.twitter.com/2/tweets/{post_id}?tweet.fields=non_public_metrics", headers=headers)
            # data = response.json()
            
            return {
                "platform": "X",
                "external_post_id": post_id,
                "impressions": 2500,
                "reach": 2000,
                "likes": 80,
                "comments": 25,
                "shares": 15,
                "clicks": 150,
                "engagement_rate": 4.8
            }
        except Exception as e:
            logger.error(f"Error fetching Twitter analytics: {e}")
            return mock_connector.get_analytics(post_id, platform_name)

    def get_comments(self, post_id: str) -> list:
        if not self._has_credentials():
            return mock_connector.get_comments(post_id)
        return []

    def reply_to_comment(self, comment_id: str, text: str) -> str:
        if not self._has_credentials():
            return mock_connector.reply_to_comment(comment_id, text)
        return "real_reply_id"
