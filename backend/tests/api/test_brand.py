from fastapi.testclient import TestClient
from app.main import app
import pytest

client = TestClient(app)

# Use the same override approach as test_organizations for real tests...
# For brevity in this test file, assume db is mocked or seeded.
