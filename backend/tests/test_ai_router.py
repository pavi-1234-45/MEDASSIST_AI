"""Tests for AI router endpoints."""
from unittest.mock import patch, MagicMock


class TestChatEndpoint:
    """Tests for POST /ai/chat"""

    @patch("app.routers.ai.get_ai_client")
    @patch("app.routers.ai.get_medical_context")
    def test_chat_success(self, mock_rag, mock_ai, client):
        mock_rag.return_value = ("", [])
        mock_client = MagicMock()
        mock_client.chat.return_value = "I recommend consulting a doctor."
        mock_ai.return_value = mock_client

        response = client.post("/ai/chat", json={
            "message": "I have a headache",
            "language": "en",
            "role": "patient",
            "history": [],
        })

        assert response.status_code == 200
        data = response.json()
        assert "reply" in data
        assert "emergency" in data
        assert data["emergency"] is False

    @patch("app.routers.ai.get_ai_client")
    @patch("app.routers.ai.get_medical_context")
    def test_chat_emergency_detection(self, mock_rag, mock_ai, client):
        mock_rag.return_value = ("", [])
        mock_client = MagicMock()
        mock_client.chat.return_value = "This sounds urgent. Please seek immediate help."
        mock_ai.return_value = mock_client

        response = client.post("/ai/chat", json={
            "message": "I have severe chest pain and breathing difficulty",
            "language": "en",
            "role": "patient",
        })

        assert response.status_code == 200
        data = response.json()
        assert data["emergency"] is True

    @patch("app.routers.ai.get_ai_client")
    @patch("app.routers.ai.get_medical_context")
    def test_chat_with_history(self, mock_rag, mock_ai, client):
        mock_rag.return_value = ("", [])
        mock_client = MagicMock()
        mock_client.chat.return_value = "Based on our conversation, consult a specialist."
        mock_ai.return_value = mock_client

        response = client.post("/ai/chat", json={
            "message": "What about side effects?",
            "language": "en",
            "role": "patient",
            "history": [
                {"role": "user", "text": "Tell me about metformin"},
                {"role": "assistant", "text": "Metformin is used for diabetes."},
            ],
        })

        assert response.status_code == 200

    def test_chat_empty_message(self, client):
        response = client.post("/ai/chat", json={
            "message": "",
            "language": "en",
            "role": "patient",
        })
        assert response.status_code == 422  # Validation error


class TestVoiceEndpoint:
    """Tests for POST /ai/voice-assistant"""

    @patch("app.routers.ai.get_ai_client")
    @patch("app.routers.ai.get_medical_context")
    def test_voice_success(self, mock_rag, mock_ai, client):
        mock_rag.return_value = ("", [])
        mock_client = MagicMock()
        mock_client.chat.return_value = "Take rest and stay hydrated."
        mock_ai.return_value = mock_client

        response = client.post("/ai/voice-assistant", json={
            "message": "I have a fever",
            "language": "en",
            "role": "patient",
        })

        assert response.status_code == 200
        data = response.json()
        assert "reply" in data
        assert "emergency" in data
