from app.services.connectors.base import SocialConnector
from app.services.connectors.mock.mock_connector import mock_connector
from app.services.connectors.linkedin.linkedin_connector import LinkedInConnector
from app.services.connectors.twitter.twitter_connector import TwitterConnector

def get_connector(platform: str) -> SocialConnector:
    """
    Returns the appropriate social connector for the given platform.
    If the platform doesn't have a specialized connector, returns the mock connector.
    """
    platform = platform.upper()
    if platform == "LINKEDIN":
        return LinkedInConnector()
    elif platform == "X":
        return TwitterConnector()
    else:
        return mock_connector
