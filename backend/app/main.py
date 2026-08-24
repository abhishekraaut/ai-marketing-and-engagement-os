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
    auth,
    audiences,
    leads
)

app = FastAPI(title="AI Marketing & Engagement OS")

import os
frontend_url = os.environ.get("FRONTEND_URL", "*")
allow_origins = [frontend_url] if frontend_url != "*" else ["*"]
# Also allow localhost for development
if "http://localhost:3000" not in allow_origins:
    allow_origins.append("http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
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
app.include_router(audiences.router, prefix="/api/v1", tags=["audiences"])
app.include_router(leads.router, prefix="/api/v1", tags=["leads"])

@app.get("/")
def read_root():
    return {"message": "Welcome to AI Marketing OS API"}
