from app.core.config import settings

def get_llm_provider():
    from app.services.ai.providers.google_genai_provider import google_genai_provider
    return google_genai_provider
