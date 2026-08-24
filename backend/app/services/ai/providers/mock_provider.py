from typing import Type
import json
import random
from app.services.ai.providers.base import LLMProvider, T
from app.services.ai.schemas import GeneratedCampaignContent, GeneratedPlatformVariant

class MockLLMProvider(LLMProvider):
    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        response_schema: Type[T],
    ) -> T:
        """
        A mock provider that generates deterministic, valid content based on the requested platforms.
        This allows the app to run without an actual LLM backend during dev/testing.
        """
        
        import re
        
        # Extract context from user_prompt
        topic_match = re.search(r'Topic: (.*?)\n', user_prompt)
        topic = topic_match.group(1).strip() if topic_match else "our latest strategic initiative"
        
        brand_match = re.search(r'Brand Name: (.*?)\n', user_prompt)
        brand = brand_match.group(1).strip() if brand_match else "Our Brand"

        platforms_requested = ["LINKEDIN", "X", "FACEBOOK", "INSTAGRAM", "YOUTUBE"]
        requested = [p for p in platforms_requested if p in user_prompt]
        if not requested:
            requested = platforms_requested

        variants = []
        if "LINKEDIN" in requested:
            variants.append(GeneratedPlatformVariant(
                platform="LINKEDIN",
                title="Professional Update",
                content=f"Excited to announce {brand}'s latest focus on {topic}. We believe data-driven decisions and staying ahead of trends are the future of marketing. Our team has worked hard to bring this to life.",
                cta="Read our whitepaper today",
                hashtags=["#B2B", "#MarketingStrategy", "#Innovation"],
                engagement_score=85
            ))
        if "X" in requested:
            variants.append(GeneratedPlatformVariant(
                platform="X",
                content=f"Big news from {brand}! We're diving into {topic}. Check out our latest initiative and empower your team! 🚀",
                cta="Link in bio",
                hashtags=["#Marketing", "#AI", "#Tech"],
                engagement_score=92
            ))
        if "FACEBOOK" in requested:
            variants.append(GeneratedPlatformVariant(
                platform="FACEBOOK",
                title="Community Announcement",
                content=f"Hey community! We've been working hard on something special just for you regarding {topic}. Marketing is changing, and {brand} wants you to be part of the journey.",
                cta="Join the discussion in our group",
                hashtags=["#Community", "#Growth"],
                engagement_score=75
            ))
        if "INSTAGRAM" in requested:
            variants.append(GeneratedPlatformVariant(
                platform="INSTAGRAM",
                content=f"Visuals speak louder than words. Swipe left to see how {brand} is changing the game with {topic}. 📸✨",
                caption="Behind the scenes of our latest launch.",
                cta="Link in bio",
                hashtags=["#MarketingLife", "#LaunchDay", "#InstaGood"],
                engagement_score=88
            ))
        if "YOUTUBE" in requested:
            variants.append(GeneratedPlatformVariant(
                platform="YOUTUBE",
                title=f"{brand} Presents: A Deep Dive into {topic}",
                content=f"Welcome to our channel! In this video, we break down {topic} and what it means for the future. Don't forget to like and subscribe!",
                cta="Subscribe for more",
                hashtags=["#VideoMarketing", "#DeepDive"],
                engagement_score=95
            ))
        
        # We assume the schema requested is GeneratedCampaignContent
        if response_schema == GeneratedCampaignContent:
            return GeneratedCampaignContent(
                campaign_summary="Mocked AI generation simulating a campaign strategy breakdown based on provided brand tone and objectives.",
                variants=variants
            ) # type: ignore
        
        raise ValueError("Unsupported schema for MockLLMProvider")

    def generate_content(self, prompt: str) -> dict:
        """
        Synchronous fallback for generating simple content (like replies).
        """
        lower_prompt = prompt.lower()
        
        # Simple heuristic to make mock replies feel more "context-aware"
        if any(w in lower_prompt for w in ["angry", "disappointed", "bad", "issue", "problem", "hate"]):
            reply = "We're so sorry to hear about this experience. Please DM us so we can make this right!"
        elif any(w in lower_prompt for w in ["love", "great", "awesome", "good", "amazing", "best"]):
            reply = "Thank you so much! We're thrilled you're enjoying it. Let us know if you need anything else! 🚀"
        elif any(w in lower_prompt for w in ["question", "how", "what", "why", "when", "help"]):
            reply = "Great question! You can find more details about this on our help center, or send us a DM and we'll walk you through it."
        else:
            reply = "Thanks for your comment! We really appreciate the feedback and engagement."
            
        return {
            "content": reply
        }

mock_llm_provider = MockLLMProvider()
mock_provider = mock_llm_provider
