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

    def get_analytics(self, post_id: str, platform_name: str = "LINKEDIN") -> dict:
        import hashlib
        
        # We use a hash of the post_id to generate stable deterministic mock values
        # so that dashboard numbers remain consistent between refreshes
        hash_val = int(hashlib.md5(post_id.encode()).hexdigest()[:8], 16)
        
        # Base multipliers for platforms
        multipliers = {
            "LINKEDIN": (1.2, 0.08),  # High impressions, high engagement
            "INSTAGRAM": (1.5, 0.05), # Highest reach, lower engagement
            "FACEBOOK": (0.8, 0.04),  # Lower impressions
            "X": (1.8, 0.02)          # Very high impressions, very low engagement
        }
        
        m_imp, m_eng = multipliers.get(platform_name, (1.0, 0.05))
        
        impressions = int((hash_val % 100000) * m_imp) + 1000
        reach = int(impressions * 0.8)
        engagements_total = int(impressions * m_eng)
        
        likes = int(engagements_total * 0.7)
        comments = int(engagements_total * 0.2)
        shares = int(engagements_total * 0.1)
        clicks = int((hash_val % 500) * m_imp)
        
        engagement_rate = (engagements_total / impressions) * 100 if impressions > 0 else 0
        
        return {
            "platform": platform_name,
            "external_post_id": post_id,
            "impressions": impressions,
            "reach": reach,
            "likes": likes,
            "comments": comments,
            "shares": shares,
            "clicks": clicks,
            "engagement_rate": round(engagement_rate, 2)
        }

    def get_comments(self, post_id: str) -> list:
        import hashlib
        # Deterministic generation
        hash_val = int(hashlib.md5(post_id.encode()).hexdigest()[:8], 16)
        
        comments = []
        if hash_val % 2 == 0:
            comments.append({
                "external_engagement_id": f"comment_{hash_val}_1",
                "author_name": "Alice M.",
                "author_handle": "@alicem",
                "content": "This is excellent! I love it.",
                "engagement_type": "COMMENT"
            })
        if hash_val % 3 == 0:
            comments.append({
                "external_engagement_id": f"comment_{hash_val}_2",
                "author_name": "Bob D.",
                "author_handle": "@bobd",
                "content": "How much does it cost?",
                "engagement_type": "COMMENT"
            })
        if hash_val % 5 == 0:
            comments.append({
                "external_engagement_id": f"comment_{hash_val}_3",
                "author_name": "Charlie R.",
                "author_handle": "@charlier",
                "content": "This didn't work for me.",
                "engagement_type": "COMMENT"
            })
        return comments

    def reply_to_comment(self, comment_id: str, text: str) -> str:
        import uuid
        return f"mock_reply_{uuid.uuid4().hex[:8]}"




mock_connector = MockSocialConnector()
