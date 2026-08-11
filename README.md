# AI Marketing & Engagement OS

A Senior Developer assignment demonstrating product thinking, AI orchestration, clean UI, and data modeling.

## Phases Implemented

* **Phase 1**: Project Foundation (File structure, base models, Docker)
* **Phase 2**: Production Domain Model (SQLAlchemy mapping, Enums, Migrations, Seed script)
* **Phase 3**: Brand Brain + Core API (Pydantic schemas, Service layers, Fast API routes, Next.js integration)

## Phase 3 Features

* **Brand Brain API & UI**: Configure your brand identity, tone, and guardrails via a robust UI form in the Next.js frontend (`/brand`), wired to the FastAPI backend.
* **Social Accounts API & UI**: Manage connection statuses (using a Mock Connector) across LinkedIn, X, Instagram, and Facebook in the settings tab (`/settings`).
* **Campaign Foundation API & UI**: Dashboard to create and list Campaigns (`/campaigns`).
* **Multi-Tenant Security**: Organizations are isolated in API calls. A development Organization ID (`1`) is temporarily injected.
* **Security & Tokens**: Social OAuth tokens are never exposed in JSON responses. 

## Run Instructions (Docker Preferred)

```bash
docker compose up --build
```
Access the application at:
- Frontend: http://localhost:3000
- Backend Swagger API Docs: http://localhost:8000/docs

## Development Setup

```bash
# Seed local testing data
python backend/seed.py
```

*Note: You may need native PostgreSQL headers to compile `psycopg2-binary` if running locally without Docker.*
