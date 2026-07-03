from pydantic_settings import BaseSettings
from typing import Optional, List


class Settings(BaseSettings):
    """
    Centralized configuration using Pydantic BaseSettings.
    All values are read from environment variables or .env file,
    with sensible defaults for local development.
    """

    # --- AI / LLM Configuration ---
    AI_API_KEY: str = "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"
    AI_API_BASE_URL: str = "https://integrate.api.nvidia.com/v1"
    AI_MODEL_CHAT: str = "meta/llama-3.1-8b-instruct"
    AI_MODEL_VOICE: str = "openai/gpt-oss-120b"
    AI_MAX_TOKENS: int = 4096
    AI_TEMPERATURE_CHAT: float = 0.7
    AI_TEMPERATURE_VOICE: float = 1.0

    # --- External API Keys ---
    OPENFDA_API_KEY: str = "B0mcBJbkjGS6ajtz6pN61LTwmnczRGYGjV4fz61K"
    DATA_GOV_IN_API_KEY: Optional[str] = "579b464db66ec23bdd0000016df62ee19e7742936caec0eec2b2cab3"
    WHISPER_API_KEY: Optional[str] = "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"
    REDIS_URL: str = "redis://localhost:6379"
    FIREBASE_CREDENTIALS_PATH: Optional[str] = None
    
    # Medi API Credentials
    MEDI_CLIENT_ID: Optional[str] = "19d254d9-16ec-4a10-9bf4-144e3d5dc859_1c26f6fe-092c-4035-80a3-3f9a4a5847de"
    MEDI_CLIENT_SECRET: Optional[str] = "kNEATvsZRt47xL5m0jQyvcQvej5AoTL1oomj53xAFUY="

    # --- CORS ---
    CORS_ORIGINS: List[str] = ["*"]

    # --- Rate Limiting ---
    RATE_LIMIT_PER_MINUTE: int = 60

    # --- Blockchain ---
    BLOCKCHAIN_ENABLED: bool = True

    # --- Notifications ---
    NOTIFICATION_WEBHOOK_URL: Optional[str] = None

    # --- Logging ---
    LOG_LEVEL: str = "INFO"

    # --- Application ---
    APP_TITLE: str = "MedAssist AI Enterprise API"
    APP_DESCRIPTION: str = "Enterprise-grade healthcare assistant backend with RAG, RBAC, and audit trails."
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = True

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
