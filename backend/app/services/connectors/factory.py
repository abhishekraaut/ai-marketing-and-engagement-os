
from app.services.connectors.base import SocialConnector
from app.services.connectors.linkedin.linkedin_connector import LinkedInConnector
from app.services.connectors.twitter.twitter_connector import TwitterConnector
from app.services.connectors.meta.facebook_connector import FacebookConnector
from app.services.connectors.meta.instagram_connector import InstagramConnector

def get_connector(platform: str, access_token: str = None, external_account_id: str = None) -> SocialConnector:
    platform = platform.upper()
    if platform == "LINKEDIN":
        return LinkedInConnector(access_token=access_token, external_account_id=external_account_id)
    elif platform == "X":
        return TwitterConnector()
    elif platform == "FACEBOOK":
        return FacebookConnector(access_token=access_token, page_id=external_account_id)
    elif platform == "INSTAGRAM":
        return InstagramConnector(access_token=access_token, ig_account_id=external_account_id)
    else:
        # Fallback to a mock or raise error
        return TwitterConnector()
