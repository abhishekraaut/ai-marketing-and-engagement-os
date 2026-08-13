from typing import Type
import json
from google import genai
from app.services.ai.providers.base import LLMProvider, T
from app.core.config import settings

client = genai.Client(api_key=settings.AI_API_KEY)

class GoogleGenAIProvider(LLMProvider):
    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        response_schema: Type[T],
    ) -> T:
        response = await client.aio.models.generate_content(
            model='gemini-2.5-flash',
            contents=user_prompt,
            config=genai.types.GenerateContentConfig(
                system_instruction=system_prompt,
                response_mime_type="application/json",
                response_schema=response_schema,
            ),
        )
        return response_schema.model_validate_json(response.text)

    def generate_content(self, prompt: str) -> dict:
        """
        Synchronous fallback for generating simple content (like replies).
        """
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        return {"content": response.text}

google_genai_provider = GoogleGenAIProvider()
