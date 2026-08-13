from app.core.config import settings

def get_llm_provider():
    if settings.AI_PROVIDER == "google-genai":
        from app.services.ai.providers.google_genai_provider import google_genai_provider
        return google_genai_provider
    # fallback to mock
    from app.services.ai.providers.mock_provider import mock_llm_provider
    return mock_llm_provider
