import os
import httpx
import time
from datetime import datetime, timezone
import logging
from app.services.connectors.base import SocialConnector

logger = logging.getLogger(__name__)

class InstagramConnector(SocialConnector):
    def __init__(self, access_token=None, ig_account_id=None):
        from dotenv import load_dotenv
        load_dotenv()
        self.access_token = access_token or os.getenv("META_ACCESS_TOKEN") or os.getenv("FACEBOOK_PAGE_ACCESS_TOKEN")
        self.ig_account_id = ig_account_id or os.getenv("META_APP_ID") or os.getenv("INSTAGRAM_ACCOUNT_ID")
        
    def _has_credentials(self) -> bool:
        return bool(self.access_token and self.ig_account_id)
        
    def connect_account(self) -> dict:
        if not self._has_credentials():
            return {"account_id": "error", "error": "Missing Instagram Credentials"}
        return {"account_id": self.ig_account_id, "account_name": "IG Account", "access_token": self.access_token}

    def refresh_token(self, refresh_token: str) -> dict:
        return {"access_token": "refreshed"}

    def publish_post(self, content: str, media_urls: list = None, account_name: str = None) -> dict:
        if not self._has_credentials():
            return {"success": False, "permanent": True, "error": "Missing Instagram Credentials"}
            
        try:
            if not media_urls or len(media_urls) == 0:
                return {"success": False, "permanent": True, "error": "Instagram requires at least one media URL (image/video)."}
                
            media_url = media_urls[0]
            is_video = media_url.endswith('.mp4') or media_url.endswith('.mov')
            
            # Step 1: Create Media Container
            container_url = f"https://graph.facebook.com/v19.0/{self.ig_account_id}/media"
            container_payload = {
                "caption": content,
                "access_token": self.access_token
            }
            if is_video:
                container_payload["media_type"] = "REELS"
                container_payload["video_url"] = media_url
            else:
                container_payload["image_url"] = media_url
                
            res1 = httpx.post(container_url, data=container_payload)
            res1.raise_for_status()
            creation_id = res1.json().get("id")
            
            if is_video:
                # Video processing takes time
                time.sleep(10)
                
            # Step 2: Publish Container
            publish_url = f"https://graph.facebook.com/v19.0/{self.ig_account_id}/media_publish"
            res2 = httpx.post(publish_url, data={"creation_id": creation_id, "access_token": self.access_token})
            res2.raise_for_status()
            
            post_id = res2.json().get("id")
            
            return {
                "success": True, 
                "external_post_id": post_id, 
                "url": f"https://instagram.com/p/{post_id}",
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

    def get_analytics(self, post_id: str, platform_name: str = "INSTAGRAM") -> dict:
        if not self._has_credentials():
            return {"platform": platform_name, "external_post_id": post_id, "impressions": 0, "likes": 0, "comments": 0}
            
        try:
            # Instagram media insights
            url = f"https://graph.facebook.com/v19.0/{post_id}/insights?metric=impressions,reach,saved,video_views&access_token={self.access_token}"
            response = httpx.get(url)
            
            # Fetch likes and comments from the media object itself
            url_media = f"https://graph.facebook.com/v19.0/{post_id}?fields=like_count,comments_count&access_token={self.access_token}"
            res_media = httpx.get(url_media)
            
            if response.status_code == 200 and res_media.status_code == 200:
                data = response.json().get("data", [])
                media_data = res_media.json()
                
                impressions = next((item['values'][0]['value'] for item in data if item['name'] == 'impressions'), 0)
                reach = next((item['values'][0]['value'] for item in data if item['name'] == 'reach'), 0)
                likes = media_data.get("like_count", 0)
                comments = media_data.get("comments_count", 0)
                
                return {
                    "platform": platform_name,
                    "external_post_id": post_id,
                    "impressions": impressions,
                    "reach": reach,
                    "likes": likes,
                    "comments": comments,
                    "shares": 0,
                    "clicks": 0,
                    "engagement_rate": round((likes + comments) / impressions * 100, 2) if impressions else 0.0
                }
            return {"platform": platform_name, "external_post_id": post_id, "impressions": 0, "likes": 0, "comments": 0}
        except Exception as e:
            logger.error(f"Error fetching IG analytics: {e}")
            return {"platform": platform_name, "external_post_id": post_id, "impressions": 0, "likes": 0, "comments": 0}

    def get_comments(self, post_id: str = None) -> list:
        if not self._has_credentials():
            return []
            
        try:
            # Instagram Graph API allows fetching media and comments
            url = f"https://graph.facebook.com/v19.0/{self.ig_account_id}/media?fields=comments%7Btext,from,timestamp%7D&access_token={self.access_token}"
            response = httpx.get(url)
            response.raise_for_status()
            
            engagements = []
            data = response.json().get("data", [])
            for media in data:
                comments = media.get("comments", {}).get("data", [])
                for comment in comments:
                    sender = comment.get("from", {})
                    # Add simple filtering if needed
                    engagements.append({
                        "external_engagement_id": comment.get("id"),
                        "content": comment.get("text"),
                        "author_name": sender.get("username", "IG User"),
                        "author_id": sender.get("id"),
                        "created_at": comment.get("timestamp"),
                        "platform": "INSTAGRAM",
                        "type": "COMMENT",
                        "post_id": media.get("id")
                    })
                        
            return engagements
        except Exception as e:
            logger.error(f"Error fetching IG comments: {e}")
            return []

    def reply_to_comment(self, comment_id: str, text: str) -> str:
        if not self._has_credentials():
            return "error"
            
        try:
            # Meta Graph API: POST /{comment_id}/replies
            url = f"https://graph.facebook.com/v19.0/{comment_id}/replies"
            payload = {
                "message": text,
                "access_token": self.access_token
            }
            res = httpx.post(url, data=payload)
            res.raise_for_status()
            return "replied"
        except Exception as e:
            logger.error(f"Error replying on IG: {e}")
            return "error"
