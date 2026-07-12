"""
tests/test_health.py — Smoke tests for the /health endpoint and application startup.

These tests run in CI (GitHub Actions) before any deployment is triggered.
They use an in-memory SQLite database so no real Neon credentials are needed.
"""
import os
import pytest

# Set minimal env vars before importing the app so _require() doesn't raise
os.environ.setdefault("SECRET_KEY", "test-secret-key-not-real")
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("APP_ENV", "test")
os.environ.setdefault("DEBUG", "false")
os.environ.setdefault("CORS_ALLOWED_ORIGINS", "http://localhost:5173")


@pytest.fixture(scope="module")
def client():
    """Create a Flask test client with an in-memory SQLite DB."""
    from backend.app import app, db

    app.config["TESTING"] = True
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"

    with app.app_context():
        db.create_all()
        with app.test_client() as c:
            yield c


def test_health_returns_200(client):
    """The /health endpoint must return HTTP 200."""
    response = client.get("/health")
    assert response.status_code == 200


def test_health_response_format(client):
    """The /health endpoint must return a JSON body with status=ok."""
    response = client.get("/health")
    data = response.get_json()
    assert data is not None
    assert data.get("status") == "ok"
    assert "service" in data


def test_health_does_not_expose_secrets(client):
    """The /health response must not contain any sensitive keywords."""
    response = client.get("/health")
    body = response.get_data(as_text=True)
    forbidden = ["password", "secret", "token", "database_url", "DATABASE_URL"]
    for word in forbidden:
        assert word.lower() not in body.lower(), f"Secret word '{word}' found in health response"


def test_404_returns_json(client):
    """Unknown routes must return a JSON error, not an HTML page."""
    response = client.get("/this-does-not-exist")
    assert response.status_code == 404
    data = response.get_json()
    assert data is not None
    assert "message" in data
