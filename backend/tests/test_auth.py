"""
Tests for authentication routes (Story 1.1, 1.3).
"""


def test_register_success(client):
    resp = client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "password123",
    })
    assert resp.status_code == 201
    data = resp.get_json()
    assert "access_token" in data
    assert data["user"]["email"] == "test@example.com"


def test_register_duplicate_email(client):
    client.post("/api/auth/register", json={"email": "dup@example.com", "password": "password123"})
    resp = client.post("/api/auth/register", json={"email": "dup@example.com", "password": "otherpass"})
    assert resp.status_code == 409


def test_register_short_password(client):
    resp = client.post("/api/auth/register", json={"email": "short@example.com", "password": "abc"})
    assert resp.status_code == 400
    assert "8 characters" in resp.get_json()["error"]


def test_login_success(client):
    client.post("/api/auth/register", json={"email": "login@example.com", "password": "securepass"})
    resp = client.post("/api/auth/login", json={"email": "login@example.com", "password": "securepass"})
    assert resp.status_code == 200
    assert "access_token" in resp.get_json()


def test_login_wrong_password(client):
    client.post("/api/auth/register", json={"email": "wrong@example.com", "password": "correctpass"})
    resp = client.post("/api/auth/login", json={"email": "wrong@example.com", "password": "wrongpass"})
    assert resp.status_code == 401
    assert "Incorrect email or password" in resp.get_json()["error"]


def test_health_endpoint(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.get_json()["status"] == "ok"
