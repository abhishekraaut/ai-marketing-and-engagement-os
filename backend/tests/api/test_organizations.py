import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.session import get_db
from app.models.base import Base

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

def test_create_and_get_organization():
    response = client.post("/api/v1/organizations/", json={"name": "Test Org", "slug": "test-org"})
    assert response.status_code == 201
    org_id = response.json()["id"]

    response = client.get(f"/api/v1/organizations/{org_id}")
    assert response.status_code == 200
    assert response.json()["name"] == "Test Org"

def test_duplicate_organization_slug():
    client.post("/api/v1/organizations/", json={"name": "Test Org 2", "slug": "test-org-2"})
    response = client.post("/api/v1/organizations/", json={"name": "Test Org 3", "slug": "test-org-2"})
    assert response.status_code == 409
