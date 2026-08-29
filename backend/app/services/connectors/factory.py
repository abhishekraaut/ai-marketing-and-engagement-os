from app.services.connectors.base import SocialConnector
from app.services.connectors.linkedin.linkedin_connector import LinkedInConnector
from app.services.connectors.twitter.twitter_connector import TwitterConnector
from app.services.connectors.meta.facebook_connector import FacebookConnector
from app.services.connectors.meta.instagram_connector import InstagramConnector

def get_connector(platform: str) -> SocialConnector:
    platform = platform.upper()
    if platform == "LINKEDIN":
        return LinkedInConnector()
    elif platform == "X":
        return TwitterConnector()
    elif platform == "FACEBOOK":
        return FacebookConnector()
    elif platform == "INSTAGRAM":
        return InstagramConnector()
    else:
        # Fallback to a mock or raise error
        return TwitterConnector()
