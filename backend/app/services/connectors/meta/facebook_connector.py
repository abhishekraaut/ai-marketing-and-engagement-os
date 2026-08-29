import os
import httpx
from datetime import datetime, timezone
import logging
from app.services.connectors.base import SocialConnector

logger = logging.getLogger(__name__)

class FacebookConnector(SocialConnector):
    def __init__(self):
        from dotenv import load_dotenv
        load_dotenv()
        self.access_token = os.getenv("META_ACCESS_TOKEN") or os.getenv("FACEBOOK_PAGE_ACCESS_TOKEN")
        self.page_id = os.getenv("META_APP_ID") or os.getenv("FACEBOOK_PAGE_ID")
        
    def _has_credentials(self) -> bool:
        return bool(self.access_token and self.page_id)
        
    def connect_account(self) -> dict:
        if not self._has_credentials():
            return {"account_id": "error", "error": "Missing Facebook Credentials"}
        return {"account_id": self.page_id, "account_name": "Facebook Page", "access_token": self.access_token}

    def refresh_token(self, refresh_token: str) -> dict:
        return {"access_token": "refreshed"}

    def publish_post(self, content: str, media_urls: list = None, account_name: str = None) -> dict:
        if not self._has_credentials():
            return {"success": False, "permanent": True, "error": "Missing Facebook Credentials"}
            
        try:
            url = f"https://graph.facebook.com/v19.0/{self.page_id}"
            
            if media_urls and len(media_urls) > 0:
                # Post with Photo
                endpoint = f"{url}/photos"
                payload = {
                    "url": media_urls[0],
                    "caption": content,
                    "access_token": self.access_token
                }
            else:
                # Text only
                endpoint = f"{url}/feed"
                payload = {
                    "message": content,
                    "access_token": self.access_token
                }
                
            response = httpx.post(endpoint, data=payload)
            response.raise_for_status()
            data = response.json()
            
            post_id = data.get("id")
            return {
                "success": True, 
                "external_post_id": post_id, 
                "url": f"https://facebook.com/{post_id}",
                "published_at": datetime.now(timezone.utc).isoformat()
            }
        except Exception as e:
            is_permanent = False
            if isinstance(e, httpx.HTTPStatusError) and 400 <= e.response.status_code < 500:
                is_permanent = True
            logger.error(f"Error publishing: {e}")
            return {"success": False, "permanent": is_permanent, "error": str(e)}

    def get_post(self, post_id: str) -> dict:
        return {}

    def get_analytics(self, post_id: str, platform_name: str = "FACEBOOK") -> dict:
        if not self._has_credentials():
            return {"platform": platform_name, "external_post_id": post_id, "impressions": 0, "likes": 0, "comments": 0}
            
        try:
            url = f"https://graph.facebook.com/v19.0/{post_id}/insights?metric=post_impressions,post_reactions_by_type_total,post_comments&access_token={self.access_token}"
            response = httpx.get(url)
            response.raise_for_status()
            data = response.json().get("data", [])
            
            impressions = next((item['values'][0]['value'] for item in data if item['name'] == 'post_impressions'), 0)
            reactions = next((item['values'][0]['value'] for item in data if item['name'] == 'post_reactions_by_type_total'), {})
            likes = reactions.get("like", 0) if isinstance(reactions, dict) else 0
            comments = next((item['values'][0]['value'] for item in data if item['name'] == 'post_comments'), 0)
            
            return {
                "platform": platform_name,
                "external_post_id": post_id,
                "impressions": impressions,
                "reach": impressions,
                "likes": likes,
                "comments": comments,
                "shares": 0,
                "clicks": 0,
                "engagement_rate": round((likes + comments) / impressions * 100, 2) if impressions else 0.0
            }
        except Exception as e:
            logger.error(f"Error fetching FB analytics: {e}")
            return {"platform": platform_name, "external_post_id": post_id, "impressions": 0, "likes": 0, "comments": 0}

    def get_comments(self, post_id: str) -> list:
        return []

    def reply_to_comment(self, comment_id: str, text: str) -> str:
        return "replied"
