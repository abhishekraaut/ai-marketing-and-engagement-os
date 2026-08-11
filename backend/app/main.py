from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import (
    health,
    organizations,
    brand,
    social_accounts,
    campaigns,
    content,
    schedules
)

app = FastAPI(title="AI Marketing & Engagement OS")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api/v1/health", tags=["health"])
app.include_router(organizations.router, prefix="/api/v1/organizations", tags=["organizations"])
app.include_router(brand.router, prefix="/api/v1/organizations", tags=["brand"])
app.include_router(social_accounts.router, prefix="/api/v1", tags=["social_accounts"])
app.include_router(campaigns.router, prefix="/api/v1", tags=["campaigns"])
app.include_router(content.router, prefix="/api/v1", tags=["content"])
app.include_router(schedules.router, prefix="/api/v1", tags=["schedules"])

@app.get("/")
def read_root():
    return {"message": "Welcome to AI Marketing OS API"}
