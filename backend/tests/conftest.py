"""
Shared test fixtures for the MedAssist AI backend test suite.
"""
import sys
import os
import pytest
from unittest.mock import MagicMock, patch

# Ensure the backend app is importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# ──────────────────────────────────────────────────────────────────────
# Mock Firebase Admin before any app imports
# ──────────────────────────────────────────────────────────────────────
mock_firebase_admin = MagicMock()
mock_firebase_auth = MagicMock()
mock_firebase_creds = MagicMock()
mock_firestore = MagicMock()

sys.modules["firebase_admin"] = mock_firebase_admin
sys.modules["firebase_admin.auth"] = mock_firebase_auth
sys.modules["firebase_admin.credentials"] = mock_firebase_creds
sys.modules["firebase_admin.firestore"] = mock_firestore

mock_firebase_admin.get_app = MagicMock(side_effect=ValueError("No app"))
mock_firebase_admin.initialize_app = MagicMock()

# Now we can safely import the app
from fastapi.testclient import TestClient
from app.main import app
from app.security.auth import get_current_user


# ──────────────────────────────────────────────────────────────────────
# Override auth dependency for testing
# ──────────────────────────────────────────────────────────────────────
def mock_user_patient():
    return {
        "uid": "test-patient-001",
        "email": "patient@test.com",
        "role": "patient",
        "display_name": "Test Patient",
    }


def mock_user_doctor():
    return {
        "uid": "test-doctor-001",
        "email": "doctor@test.com",
        "role": "doctor",
        "display_name": "Dr. Test",
    }


def mock_user_admin():
    return {
        "uid": "test-admin-001",
        "email": "admin@test.com",
        "role": "admin",
        "display_name": "Admin Test",
    }


@pytest.fixture
def client():
    """Test client with patient-role auth override."""
    app.dependency_overrides[get_current_user] = mock_user_patient
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def doctor_client():
    """Test client with doctor-role auth override."""
    app.dependency_overrides[get_current_user] = mock_user_doctor
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def admin_client():
    """Test client with admin-role auth override."""
    app.dependency_overrides[get_current_user] = mock_user_admin
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
