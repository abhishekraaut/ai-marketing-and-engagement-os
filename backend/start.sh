#!/bin/bash
set -e

echo "========================================"
echo "Starting FastAPI backend container"
echo "Python version:"
python --version
echo "Pip version:"
pip --version
echo "Alembic version:"
alembic --version
echo "========================================="

echo "Running Alembic migrations..."
alembic upgrade head

echo "Seeding initial data (if not already seeded)..."
python seed.py

echo "Starting Uvicorn server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
