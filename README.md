# AI Marketing & Engagement OS

An AI-powered Marketing Automation and Engagement Operating System. This project was developed as a comprehensive technical assignment showcasing full-stack capabilities with Next.js, FastAPI, PostgreSQL, Redis, Celery, and AI mock integrations.

## 🚀 Project Overview

The AI Marketing & Engagement OS empowers businesses to manage their brand identity, generate AI-driven social media campaigns across multiple platforms, schedule content, analyze engagement trends, and interact with their audience through a centralized inbox.

### Key Features
- **Brand Brain**: Store and manage brand guidelines, tone of voice, and prohibited keywords to ensure AI safety.
- **Campaign Generator**: Generate platform-specific social media variants (LinkedIn, X, Facebook, Instagram) via AI.
- **Human-in-the-Loop Approval**: Review, edit, and approve AI-generated content before scheduling.
- **Engagement Inbox**: View social media comments and use AI to draft brand-safe replies.
- **Analytics & Trends**: Monitor engagement metrics, view top-performing content, and receive AI-driven strategy recommendations.
- **Multi-Tenancy & RBAC**: Organization-scoped data with Role-Based Access Control (Admin, Editor, Viewer).

---

## 🛠️ Architecture

- **Frontend**: Next.js 14 (App Router), React, TailwindCSS, TanStack Query, Recharts.
- **Backend**: Python, FastAPI, SQLAlchemy, Alembic (Migrations), JWT Authentication.
- **Task Queue**: Celery & Redis for asynchronous background tasks (e.g., analytics syncing).
- **Database**: PostgreSQL.
- **AI Integrations**: Structured Mock LLM provider with fallback capabilities for real API implementations.

---

## 🔐 Demo Credentials

Use the following credentials to access the application and explore the demo data:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `abhishek@aiagency.com` | `password123` |
| **Editor** | `marketing@aiagency.com` | `password123` |
| **Viewer** | `content@aiagency.com` | `password123` |

---

## 🐳 Running with Docker (Recommended)

The easiest way to run the entire stack (Database, Redis, Backend, Celery, Frontend) is using Docker Compose.

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd "5th Technical assignment"
   ```

2. **Start the environment**:
   ```bash
   docker compose up --build
   ```

3. **Access the application**:
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

*Note: The Docker environment automatically applies database migrations and seeds the demo data.*

---

## 💻 Running Locally (Manual Setup)

If you prefer to run the services directly on your machine without Docker, follow these steps:

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL
- Redis Server

### 1. Backend Setup

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure Environment Variables:
   Copy `.env.example` to `.env` and update the `DATABASE_URL` and `REDIS_URL` to match your local services.
   ```bash
   cp .env.example .env
   ```
5. Run Migrations & Seed Data:
   ```bash
   alembic upgrade head
   python seed.py
   ```
6. Start the FastAPI Server:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
7. Start Celery Worker (In a new terminal):
   ```bash
   cd backend
   celery -A app.workers.celery_worker.celery_app worker --loglevel=info
   ```

### 2. Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure Environment Variables:
   Copy `.env.example` to `.env.local` if necessary (defaults to `localhost:8000` for the API).
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Access the app at [http://localhost:3000](http://localhost:3000).

---

## 📂 Project Structure

```
.
├── backend/                  # FastAPI Application
│   ├── alembic/              # Database Migrations
│   ├── app/                  # Application Source Code
│   │   ├── api/              # RESTful API Endpoints
│   │   ├── core/             # Config, Security, JWT
│   │   ├── db/               # Database Sessions
│   │   ├── models/           # SQLAlchemy Models
│   │   ├── services/         # Business Logic, AI Providers, Connectors
│   │   └── workers/          # Celery Tasks
│   └── seed.py               # Demo Data Generation
│
├── frontend/                 # Next.js Application
│   ├── app/                  # App Router Pages & Layouts
│   ├── components/           # Reusable UI Components
│   └── lib/                  # API Client (React Query setup)
│
└── docker-compose.yml        # Docker Orchestration
```
