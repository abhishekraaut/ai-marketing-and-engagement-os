import os
import httpx
from datetime import datetime, timezone
import logging
from app.services.connectors.base import SocialConnector

logger = logging.getLogger(__name__)

class FacebookConnector(SocialConnector):
    def __init__(self, access_token=None, page_id=None):
        from dotenv import load_dotenv
        load_dotenv()
        self.access_token = access_token or os.getenv("META_ACCESS_TOKEN") or os.getenv("FACEBOOK_PAGE_ACCESS_TOKEN")
        self.page_id = page_id or os.getenv("META_APP_ID") or os.getenv("FACEBOOK_PAGE_ID")
        
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

    def get_comments(self, post_id: str = None) -> list:
        if not self._has_credentials():
            return []
            
        try:
            # We fetch conversations (DMs) and comments for the page
            # To fetch page-level comments, we can query the page feed and comments
            # Or if post_id is provided, fetch for that post.
            
            # For this Phase, we'll fetch Conversations (Inbox)
            url = f"https://graph.facebook.com/v19.0/{self.page_id}/conversations?fields=messages%7Bmessage,from,created_time%7D&access_token={self.access_token}"
            response = httpx.get(url)
            response.raise_for_status()
            
            engagements = []
            data = response.json().get("data", [])
            for conv in data:
                messages = conv.get("messages", {}).get("data", [])
                for msg in messages:
                    # Don't pull our own messages if from page
                    sender = msg.get("from", {})
                    if str(sender.get("id")) != str(self.page_id):
                        engagements.append({
                            "external_engagement_id": msg.get("id"),
                            "content": msg.get("message"),
                            "author_name": sender.get("name", "Unknown"),
                            "author_id": sender.get("id"),
                            "created_at": msg.get("created_time"),
                            "platform": "FACEBOOK",
                            "type": "DIRECT_MESSAGE",
                            "post_id": conv.get("id") # Store conversation ID to reply
                        })
                        
            return engagements
        except Exception as e:
            logger.error(f"Error fetching FB comments/DMs: {e}")
            return []

    def reply_to_comment(self, comment_id: str, text: str) -> str:
        if not self._has_credentials():
            return "error"
            
        try:
            # comment_id could be a message_id or conversation_id based on how we mapped it
            # Meta Graph API: POST /{conversation_id}/messages
            url = f"https://graph.facebook.com/v19.0/{comment_id}/messages"
            payload = {
                "message": text,
                "access_token": self.access_token
            }
            res = httpx.post(url, data=payload)
            res.raise_for_status()
            return "replied"
        except Exception as e:
            logger.error(f"Error replying on FB: {e}")
            return "error"
