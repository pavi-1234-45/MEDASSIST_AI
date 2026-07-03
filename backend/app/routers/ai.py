import logging
from fastapi import APIRouter, Depends, HTTPException
from app.schemas.ai import ChatRequest, VoiceRequest, AIResponse
from app.services.ai_service import ai_service
from app.security.auth import get_current_user
from app.services.blockchain import blockchain_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["AI Integration"])


@router.post("/chat", response_model=AIResponse)
async def chat_endpoint(req: ChatRequest, current_user: dict = Depends(get_current_user)):
    try:
        result = ai_service.process_chat(req.message, req.language, req.role, req.history)

        # Audit logging (non-critical — don't let it break the response)
        try:
            blockchain_service.log_audit_event("CHAT_QUERY", current_user.get("uid"), "AI_CHAT")
        except Exception:
            pass

        return AIResponse(**result)
    except Exception as exc:
        logger.error("AI chat endpoint error: %s", exc, exc_info=True)
        # Return a graceful fallback instead of a 500
        return AIResponse(
            reply="I'm sorry, I'm having trouble connecting to the AI service right now. Please try again in a moment. If this persists, please consult a healthcare professional directly.",
            emergency=False,
        )


@router.post("/voice-assistant", response_model=AIResponse)
async def voice_endpoint(req: VoiceRequest, current_user: dict = Depends(get_current_user)):
    try:
        result = ai_service.process_voice_assistant(req.message, req.language, req.role)

        try:
            blockchain_service.log_audit_event("VOICE_QUERY", current_user.get("uid"), "AI_VOICE")
        except Exception:
            pass

        return AIResponse(**result)
    except Exception as exc:
        logger.error("AI voice endpoint error: %s", exc, exc_info=True)
        return AIResponse(
            reply="I'm sorry, the voice assistant is temporarily unavailable. Please try the chat mode or consult a doctor.",
            emergency=False,
        )
