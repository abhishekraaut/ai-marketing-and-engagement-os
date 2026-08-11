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
        
        # We parse the user_prompt slightly to guess the platforms requested.
        platforms_requested = ["LINKEDIN", "X", "FACEBOOK", "INSTAGRAM"]
        if "Platform:" in user_prompt:
            # Try to narrow it down if the prompt specifies
            for p in platforms_requested:
                if p in user_prompt:
                    pass # We'll just generate them all based on the prompt string loosely or fall back

        # Create dummy variants for all 4 platforms to be safe, filtering will happen later if needed.
        variants = [
            GeneratedPlatformVariant(
                platform="LINKEDIN",
                title="Professional Update",
                content="Excited to announce our latest strategic initiative. We believe data-driven decisions are the future of marketing. Our team has worked hard to bring this to life.",
                cta="Read our whitepaper today",
                hashtags=["#B2B", "#MarketingStrategy", "#Innovation"],
                engagement_score=85
            ),
            GeneratedPlatformVariant(
                platform="X",
                content="Big news! Data-driven decisions are the future. Check out our latest initiative and empower your team! 🚀",
                cta="Link in bio",
                hashtags=["#Marketing", "#AI", "#Tech"],
                engagement_score=92
            ),
            GeneratedPlatformVariant(
                platform="FACEBOOK",
                title="Community Announcement",
                content="Hey community! We've been working hard on something special just for you. Marketing is changing, and we want you to be part of the journey.",
                cta="Join the discussion in our group",
                hashtags=["#Community", "#Growth"],
                engagement_score=75
            ),
            GeneratedPlatformVariant(
                platform="INSTAGRAM",
                content="Visuals speak louder than words. Swipe left to see how we're changing the game. 📸✨",
                caption="Behind the scenes of our latest launch.",
                cta="Link in bio",
                hashtags=["#MarketingLife", "#LaunchDay", "#InstaGood"],
                engagement_score=88
            )
        ]
        
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
        return {
            "content": "Thanks for sharing! We appreciate the feedback."
        }

mock_llm_provider = MockLLMProvider()
mock_provider = mock_llm_provider
