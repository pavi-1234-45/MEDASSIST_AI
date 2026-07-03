from fastapi import APIRouter, Depends
from app.schemas.ai import ChatRequest, VoiceRequest, AIResponse
from app.services.ai_service import ai_service
from app.security.auth import get_current_user
from app.services.blockchain import blockchain_service

router = APIRouter(prefix="/ai", tags=["AI Integration"])

@router.post("/chat", response_model=AIResponse)
async def chat_endpoint(req: ChatRequest, current_user: dict = Depends(get_current_user)):
    result = ai_service.process_chat(req.message, req.language, req.role, req.history)
    
    # Example of audit logging
    blockchain_service.log_audit_event("CHAT_QUERY", current_user.get("uid"), "AI_CHAT")
    
    return AIResponse(**result)

@router.post("/voice-assistant", response_model=AIResponse)
async def voice_endpoint(req: VoiceRequest, current_user: dict = Depends(get_current_user)):
    result = ai_service.process_voice_assistant(req.message, req.language, req.role)
    
    blockchain_service.log_audit_event("VOICE_QUERY", current_user.get("uid"), "AI_VOICE")
    
    return AIResponse(**result)
