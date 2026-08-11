from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/marketing_os"
    REDIS_URL: str = "redis://localhost:6379/0"
    AI_PROVIDER: str = "openai"
    AI_API_KEY: str = ""
    JWT_SECRET: str = "secret"
    
    class Config:
        env_file = ".env"

settings = Settings()
