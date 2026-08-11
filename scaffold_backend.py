import os

dirs = [
    "backend",
    "backend/app",
    "backend/app/api",
    "backend/app/api/v1",
    "backend/app/core",
    "backend/app/db",
    "backend/app/models",
    "backend/app/schemas",
    "backend/app/services",
    "backend/app/services/ai",
    "backend/app/services/campaigns",
    "backend/app/services/analytics",
    "backend/app/services/engagement",
    "backend/app/services/email",
    "backend/app/services/connectors",
    "backend/app/services/connectors/mock",
    "backend/app/services/connectors/linkedin",
    "backend/app/workers",
    "backend/alembic",
    "backend/alembic/versions",
]

for d in dirs:
    os.makedirs(d, exist_ok=True)

def write_file(path, content):
    with open(path, "w") as f:
        f.write(content.strip() + "\n")

write_file("backend/requirements.txt", """
fastapi==0.104.0
uvicorn==0.23.2
sqlalchemy==2.0.22
alembic==1.12.0
psycopg2-binary==2.9.9
pydantic==2.4.2
pydantic-settings==2.0.3
celery==5.3.4
redis==5.0.1
""")

write_file("backend/Dockerfile", """
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
""")

write_file("backend/app/__init__.py", "")
write_file("backend/app/api/__init__.py", "")
write_file("backend/app/api/v1/__init__.py", "")
write_file("backend/app/core/__init__.py", "")
write_file("backend/app/db/__init__.py", "")
write_file("backend/app/models/__init__.py", "")
write_file("backend/app/schemas/__init__.py", "")
write_file("backend/app/services/__init__.py", "")
write_file("backend/app/workers/__init__.py", "")

write_file("backend/app/core/config.py", """
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
""")

write_file("backend/app/db/base.py", """
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass
""")

write_file("backend/app/db/session.py", """
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
""")

write_file("backend/app/models/base.py", """
from sqlalchemy import Column, Integer, DateTime
from sqlalchemy.sql import func
from app.db.base import Base

class TimestampMixin:
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
""")

write_file("backend/app/models/user.py", """
from sqlalchemy import Column, Integer, String, ForeignKey
from app.db.base import Base
from app.models.base import TimestampMixin

class User(Base, TimestampMixin):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)

class Organization(Base, TimestampMixin):
    __tablename__ = "organizations"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
""")

write_file("backend/app/models/__init__.py", """
from app.db.base import Base
from app.models.user import User, Organization
""")

write_file("backend/app/api/v1/health.py", """
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db

router = APIRouter()

@router.get("/")
def health_check():
    return {"status": "ok", "service": "ai-marketing-api"}

@router.get("/db")
def health_check_db(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "service": "ai-marketing-api-db"}
    except Exception as e:
        return {"status": "error", "detail": str(e)}
""")

write_file("backend/app/main.py", """
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import health

app = FastAPI(title="AI Marketing & Engagement OS")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api/v1/health", tags=["health"])

@app.get("/")
def read_root():
    return {"message": "Welcome to AI Marketing OS API"}
""")

write_file("backend/app/workers/celery_app.py", """
from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "ai_marketing_worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

celery_app.conf.task_routes = {
    "app.workers.celery_app.health_check_task": "main-queue"
}

@celery_app.task
def health_check_task():
    return {"status": "ok", "task": "health_check_task"}
""")

write_file("backend/app/services/connectors/base.py", """
from typing import Protocol

class SocialConnector(Protocol):
    def connect_account(self) -> bool: ...
    def refresh_token(self) -> bool: ...
    def publish_post(self, content: str) -> dict: ...
    def get_post(self, post_id: str) -> dict: ...
    def get_analytics(self) -> dict: ...
    def get_comments(self) -> list: ...
    def reply_to_comment(self, comment_id: str, text: str) -> bool: ...
""")

write_file("backend/alembic.ini", """
[alembic]
script_location = alembic
prepend_sys_path = .
version_path_separator = os

[post_write_hooks]

[loggers]
keys = root,sqlalchemy,alembic

[handlers]
keys = console

[formatters]
keys = generic

[logger_root]
level = WARN
handlers = console
qualname =

[logger_sqlalchemy]
level = WARN
handlers =
qualname = sqlalchemy.engine

[logger_alembic]
level = INFO
handlers =
qualname = alembic

[handler_console]
class = StreamHandler
args = (sys.stderr,)
level = NOTSET
formatter = generic

[formatter_generic]
format = %(levelname)-5.5s [%(name)s] %(message)s
datefmt = %H:%M:%S
""")

write_file("backend/alembic/env.py", """
import os
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context
from app.db.base import Base
import app.models  # Ensure models are loaded
from app.core.config import settings

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def run_migrations_offline() -> None:
    url = settings.DATABASE_URL
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = settings.DATABASE_URL
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
""")

print("Backend scaffolded successfully.")
