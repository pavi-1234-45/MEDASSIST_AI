"""
Singleton OpenAI-compatible client wrapper for the Nvidia AI API.
Handles model selection, retry logic, and error handling.
"""
import logging
import time
from typing import List, Dict, Optional

from openai import OpenAI

from app.config.settings import settings

logger = logging.getLogger(__name__)

_client: Optional[OpenAI] = None


def get_ai_client() -> "AIClient":
    """Return a singleton AIClient."""
    return AIClient()


class AIClient:
    """
    Wrapper around the OpenAI SDK configured for the Nvidia API.
    Provides model-type routing and retry logic.
    """

    def __init__(self):
        global _client
        if _client is None:
            _client = OpenAI(
                base_url=settings.AI_API_BASE_URL,
                api_key=settings.AI_API_KEY,
            )
            logger.info("AI client initialised → %s", settings.AI_API_BASE_URL)
        self._client = _client

    def chat(
        self,
        messages: List[Dict[str, str]],
        model_type: str = "chat",
        max_retries: int = 2,
    ) -> str:
        """
        Send a chat completion request.

        Args:
            messages: OpenAI-format messages list.
            model_type: "chat" or "voice" — selects the appropriate model.
            max_retries: Retry count on transient failures.

        Returns:
            The assistant's reply text.
        """
        model = (
            settings.AI_MODEL_CHAT if model_type == "chat" else settings.AI_MODEL_VOICE
        )
        temperature = (
            settings.AI_TEMPERATURE_CHAT
            if model_type == "chat"
            else settings.AI_TEMPERATURE_VOICE
        )

        last_exc = None
        for attempt in range(max_retries + 1):
            try:
                completion = self._client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=temperature,
                    top_p=1,
                    max_tokens=settings.AI_MAX_TOKENS,
                    stream=False,
                )

                reply = completion.choices[0].message.content
                reasoning = getattr(completion.choices[0].message, "reasoning_content", None)
                if reasoning:
                    logger.debug("Model reasoning: %s", reasoning[:200])

                return reply

            except Exception as exc:
                last_exc = exc
                if attempt < max_retries:
                    wait = 2 ** attempt  # exponential backoff: 1s, 2s
                    logger.warning(
                        "AI request failed (attempt %d/%d): %s — retrying in %ds",
                        attempt + 1,
                        max_retries + 1,
                        exc,
                        wait,
                    )
                    time.sleep(wait)

        logger.error("AI request failed after %d attempts: %s", max_retries + 1, last_exc)
        raise last_exc
