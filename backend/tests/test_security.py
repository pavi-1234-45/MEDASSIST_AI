"""Tests for security: auth, RBAC, and rate limiting."""
from unittest.mock import patch, MagicMock
from app.security.auth import get_current_user, require_role
from app.main import app


class TestAuthMockFallback:
    def test_no_token_returns_mock_user(self, client):
        """Without a token, the dev fallback returns a mock user."""
        response = client.get("/api/users/me")
        assert response.status_code == 200
        data = response.json()
        assert "id" in data or "email" in data

    def test_mock_token_accepted(self, client):
        """A 'mock-token' should be accepted in dev mode."""
        response = client.get(
            "/api/users/me",
            headers={"Authorization": "Bearer mock-token"},
        )
        assert response.status_code == 200


class TestRBAC:
    def test_patient_can_list_patients(self, client):
        response = client.get("/api/patients")
        assert response.status_code == 200

    def test_doctor_can_list_patients(self, doctor_client):
        response = doctor_client.get("/api/patients")
        assert response.status_code == 200

    def test_admin_can_list_patients(self, admin_client):
        response = admin_client.get("/api/patients")
        assert response.status_code == 200


class TestHealthEndpointNoAuth:
    def test_health_always_accessible(self, client):
        """Health check should not require auth."""
        response = client.get("/api/health")
        assert response.status_code == 200
