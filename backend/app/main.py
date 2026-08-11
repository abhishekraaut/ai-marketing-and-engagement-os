from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import (
    health,
    organizations,
    brand,
    social_accounts,
    campaigns,
    content,
    schedules,
    analytics,
    engagement,
    email,
    trends,
    auth
)

app = FastAPI(title="AI Marketing & Engagement OS")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(health.router, prefix="/api/v1/health", tags=["health"])
app.include_router(organizations.router, prefix="/api/v1/organizations", tags=["organizations"])
app.include_router(brand.router, prefix="/api/v1/organizations", tags=["brand"])
app.include_router(social_accounts.router, prefix="/api/v1", tags=["social_accounts"])
app.include_router(campaigns.router, prefix="/api/v1", tags=["campaigns"])
app.include_router(content.router, prefix="/api/v1", tags=["content"])
app.include_router(schedules.router, prefix="/api/v1", tags=["schedules"])
app.include_router(analytics.router, prefix="/api/v1", tags=["analytics"])
app.include_router(engagement.router, prefix="/api/v1", tags=["engagement"])
app.include_router(email.router, prefix="/api/v1", tags=["email"])
app.include_router(trends.router, prefix="/api/v1/organizations/{organization_id}/trends", tags=["trends"])

@app.get("/")
def read_root():
    return {"message": "Welcome to AI Marketing OS API"}
