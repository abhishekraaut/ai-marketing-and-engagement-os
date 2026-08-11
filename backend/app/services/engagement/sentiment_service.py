import re
from app.models.enums import SentimentEnum, EngagementCategoryEnum

class SentimentService:
    def classify(self, text: str) -> dict:
        text = text.lower()
        
        # Simple deterministic rules for the prototype
        if re.search(r'\b(love|excellent|great|amazing|awesome|good|thanks)\b', text):
            sentiment = SentimentEnum.POSITIVE
            category = EngagementCategoryEnum.PRAISE
        elif re.search(r'\b(not work|failed|broken|bad|terrible|hate|issue)\b', text):
            sentiment = SentimentEnum.NEGATIVE
            category = EngagementCategoryEnum.COMPLAINT
        elif re.search(r'\b(cost|pricing|buy|purchase|try|demo)\b', text):
            sentiment = SentimentEnum.POSITIVE
            category = EngagementCategoryEnum.LEAD
        elif re.search(r'\b(add|support|feature|api)\b', text):
            sentiment = SentimentEnum.NEUTRAL
            category = EngagementCategoryEnum.OTHER # mapped to FEATURE_REQUEST logically
        elif '?' in text or re.search(r'\b(how|what|when|where|why)\b', text):
            sentiment = SentimentEnum.NEUTRAL
            category = EngagementCategoryEnum.QUESTION
        else:
            sentiment = SentimentEnum.NEUTRAL
            category = EngagementCategoryEnum.OTHER
            
        return {
            "sentiment": sentiment,
            "category": category
        }

sentiment_service = SentimentService()
