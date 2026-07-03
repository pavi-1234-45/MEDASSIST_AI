"""
MedAssist AI Service — processes chat and voice requests.

Uses the AIClient wrapper (with retry logic) to call the NVIDIA API,
and the RAG pipeline to inject verified medical context from multiple
sources (WHO EML, OpenFDA, RxNorm, Data.gov.in, ICD-11, Wikipedia).
"""
import logging
from app.services.ai_client import AIClient
from app.config.settings import settings
from app.rag.pipeline import rag_pipeline

logger = logging.getLogger(__name__)

# ── Singleton AI client with retry logic ────────────────────────────
_ai_client = AIClient()

# ── Enhanced system prompt for accurate medical guidance ────────────
SYSTEM_PROMPT = (
    "You are MedAssist AI, a multilingual healthcare assistant powered by "
    "verified medical databases including the WHO Essential Medicines List, "
    "OpenFDA drug labels, RxNorm, and the WHO ICD-11 classification.\n\n"
    "YOUR CAPABILITIES:\n"
    "- Provide detailed information about medicines: indications, dosage, "
    "side effects, contraindications, interactions, and generic alternatives.\n"
    "- Explain symptoms, conditions, and diseases with their causes, "
    "risk factors, and general treatment approaches.\n"
    "- Suggest when to see a doctor and what type of specialist to consult.\n"
    "- Provide first-aid guidance for common situations.\n"
    "- Explain medical test results in simple terms.\n\n"
    "RULES:\n"
    "1. Always base your answers on the MEDICAL KNOWLEDGE CONTEXT provided. "
    "Cite the data sources (WHO EML, OpenFDA, etc.) in your response.\n"
    "2. If no context is provided, use your general medical knowledge but "
    "clearly state that the user should verify with a healthcare provider.\n"
    "3. Never provide a final diagnosis or prescribe medicine.\n"
    "4. Always recommend consulting a qualified doctor for serious concerns.\n"
    "5. If the user mentions emergency symptoms (chest pain, breathing "
    "difficulty, unconsciousness, stroke, severe bleeding, accident, severe "
    "pain, suicidal thoughts), respond with an URGENT emergency warning and "
    "advise contacting emergency services immediately.\n"
    "6. Format your responses clearly with sections and bullet points.\n"
    "7. Be empathetic and reassuring in your tone."
)

EMERGENCY_KEYWORDS = [
    "chest pain", "breathing difficulty", "unconscious", "unconsciousness",
    "stroke", "severe bleeding", "accident", "severe pain", "suicidal",
    "heart attack", "seizure", "choking", "poisoning", "overdose",
    "anaphylaxis", "allergic shock", "cannot breathe", "fainting",
]

LANGUAGE_MAP = {
    "en": "English",
    "ta": "Tamil",
    "hi": "Hindi",
    "kn": "Kannada",
    "ml": "Malayalam",
    "te": "Telugu",
}


def detect_emergency(text: str) -> bool:
    text_lower = text.lower()
    return any(kw in text_lower for kw in EMERGENCY_KEYWORDS)


class AIService:
    """Handles AI chat and voice assistant requests."""

    @staticmethod
    def process_chat(message: str, language: str, role: str, history: list) -> dict:
        is_emergency = detect_emergency(message)
        lang_name = LANGUAGE_MAP.get(language, "English")

        # Build system message with language enforcement
        system_msg = (
            f"{SYSTEM_PROMPT}\n\n"
            f"CRITICAL LANGUAGE RULE: You MUST reply ENTIRELY in {lang_name}. "
            f"Every word of your response must be in {lang_name}. "
            f"Do NOT mix languages.\n\n"
            f"User Role: {role}"
        )

        # Fetch medical context from all RAG sources
        try:
            medical_context = rag_pipeline.get_medical_context(message)
            if medical_context:
                system_msg += medical_context
        except Exception as exc:
            logger.warning("RAG pipeline error (non-fatal): %s", exc)

        # Build conversation messages
        messages = [{"role": "system", "content": system_msg}]

        # Add conversation history (last 10 messages)
        if history:
            for msg in history[-10:]:
                api_role = "assistant" if msg.role == "assistant" else "user"
                messages.append({"role": api_role, "content": msg.text})

        messages.append({"role": "user", "content": message})

        # Call AI with retry logic
        try:
            reply_text = _ai_client.chat(messages, model_type="chat")
        except Exception as exc:
            logger.error("AI API call failed: %s", exc)
            reply_text = _get_fallback_response(message, lang_name)

        # Check for emergency in the response
        if reply_text and detect_emergency(reply_text):
            is_emergency = True

        return {"reply": reply_text, "emergency": is_emergency}

    @staticmethod
    def process_voice_assistant(message: str, language: str, role: str) -> dict:
        is_emergency = detect_emergency(message)
        lang_name = LANGUAGE_MAP.get(language, "English")

        # Build prompt with language enforcement
        prompt = (
            f"{SYSTEM_PROMPT}\n\n"
            f"CRITICAL LANGUAGE RULE: You MUST reply ENTIRELY in {lang_name}. "
            f"Every single word must be in {lang_name}.\n\n"
            f"This is a VOICE interaction — keep your response concise, "
            f"conversational, and easy to listen to. Use short sentences. "
            f"Avoid long lists or complex formatting.\n\n"
            f"User Role: {role}\n"
            f"User Message: {message}"
        )

        # Fetch medical context
        try:
            medical_context = rag_pipeline.get_medical_context(message)
            if medical_context:
                prompt += medical_context
        except Exception as exc:
            logger.warning("RAG pipeline error (non-fatal): %s", exc)

        messages = [{"role": "user", "content": prompt}]

        # Call AI with retry logic
        try:
            reply_text = _ai_client.chat(messages, model_type="voice")
        except Exception as exc:
            logger.error("AI voice API call failed: %s", exc)
            reply_text = _get_fallback_response(message, lang_name)

        if reply_text and detect_emergency(reply_text):
            is_emergency = True

        return {"reply": reply_text, "emergency": is_emergency}


def _get_fallback_response(message: str, lang_name: str) -> str:
    """Generate a helpful fallback when the AI API is unreachable."""
    # Try to provide useful info from the RAG pipeline alone
    try:
        context = rag_pipeline.get_medical_context(message)
        if context and len(context) > 50:
            return (
                f"I'm having difficulty connecting to my AI engine, but here's "
                f"what I found from verified medical databases:\n\n{context}\n\n"
                f"Please consult a healthcare professional for personalized advice."
            )
    except Exception:
        pass

    return (
        "I'm sorry, I'm temporarily unable to process your request. "
        "Please try again in a moment. If you have an urgent medical concern, "
        "please contact your doctor or call emergency services immediately."
    )


ai_service = AIService()
