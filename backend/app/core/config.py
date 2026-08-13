from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/marketing_os"
    REDIS_URL: str = "redis://localhost:6379/0"
    AI_PROVIDER: str = "google-genai" # "google" || "google-genai" || "groq"
    AI_API_KEY: str = ""
    JWT_SECRET: str = "secret"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440 # 24 hours
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
