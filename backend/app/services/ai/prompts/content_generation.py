from typing import List
from app.models.domain import BrandProfile, Campaign

class PromptBuilder:
    @staticmethod
    def build_system_prompt() -> str:
        return """You are an AI marketing strategist.
You must:
- follow brand guidelines
- never use prohibited words
- never make prohibited claims
- create platform-specific content
- produce valid structured output
- optimize for engagement without clickbait"""

    @staticmethod
    def build_campaign_prompt(brand: BrandProfile, campaign: Campaign, platforms: List[str]) -> str:
        # Brand Context
        brand_context = f"""
Brand Name: {brand.name}
Description: {brand.description or 'N/A'}
Target Audience: {', '.join(brand.target_audience) if brand.target_audience else 'N/A'}
Tone: {brand.tone or 'N/A'}
Approved Messaging: {', '.join(brand.approved_messaging) if brand.approved_messaging else 'N/A'}
Prohibited Words: {', '.join(brand.prohibited_words) if brand.prohibited_words else 'None'}
Prohibited Claims: {', '.join(brand.prohibited_claims) if brand.prohibited_claims else 'None'}
Guidelines: {brand.guidelines or 'N/A'}
"""

        # Campaign Context
        campaign_context = f"""
Campaign Name: {campaign.name}
Objective: {campaign.objective or 'N/A'}
Topic: {campaign.topic or 'N/A'}
Campaign Tone: {campaign.tone or 'N/A'}
CTA: {campaign.cta or 'N/A'}
"""

        # Platform Requirements
        platform_reqs = []
        for p in platforms:
            if p == "LINKEDIN":
                platform_reqs.append("LINKEDIN: professional tone, longer-form content, thought leadership, relevant hashtags.")
            elif p == "INSTAGRAM":
                platform_reqs.append("INSTAGRAM: visual/social tone, concise caption, stronger hook, hashtags.")
            elif p == "FACEBOOK":
                platform_reqs.append("FACEBOOK: conversational, community-oriented, accessible language.")
            elif p == "X":
                platform_reqs.append("X: concise, strong hook, short-form.")

        return f"""
Please generate marketing content variants based on the following contexts.

--- BRAND BRAIN ---
{brand_context}

--- CAMPAIGN CONTEXT ---
{campaign_context}

--- PLATFORM REQUIREMENTS ---
Generate variants for the following platforms:
{chr(10).join(platform_reqs)}
"""
