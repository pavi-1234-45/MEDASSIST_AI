from openai import OpenAI
from app.config.settings import settings
from app.rag.pipeline import rag_pipeline

client = OpenAI(
  base_url=settings.AI_API_BASE_URL,
  api_key=settings.AI_API_KEY
)

SYSTEM_PROMPT = """You are MedAssist AI, a multilingual healthcare assistant. Give general health guidance only. Do not provide final diagnosis. Do not prescribe medicine. Always recommend consulting a doctor for medical advice. If the user mentions emergency symptoms like chest pain, breathing difficulty, unconsciousness, stroke symptoms, severe bleeding, accident, severe pain, or suicidal thoughts, respond with an emergency warning and advise contacting emergency services or nearest hospital immediately."""

EMERGENCY_KEYWORDS = [
    "chest pain", "breathing difficulty", "unconscious", "unconsciousness",
    "stroke", "severe bleeding", "accident", "severe pain", "suicidal"
]

def detect_emergency(text: str) -> bool:
    text_lower = text.lower()
    for keyword in EMERGENCY_KEYWORDS:
        if keyword in text_lower:
            return True
    return False

LANGUAGE_MAP = {
    "en": "English",
    "ta": "Tamil",
    "hi": "Hindi",
    "kn": "Kannada",
    "ml": "Malayalam",
    "te": "Telugu",
}

class AIService:
    @staticmethod
    def process_voice_assistant(message: str, language: str, role: str):
        is_emergency = detect_emergency(message)
        lang_name = LANGUAGE_MAP.get(language, "English")
        
        prompt = f"{SYSTEM_PROMPT}\n\nIMPORTANT LANGUAGE RULE: You MUST reply entirely in {lang_name}. User Role: {role}\nUser Message: {message}"
        
        medical_context = rag_pipeline.get_medical_context(message)
        if medical_context:
            prompt += medical_context
            
        completion = client.chat.completions.create(
            model=settings.AI_MODEL_VOICE,
            messages=[{"role": "user", "content": prompt}],
            temperature=settings.AI_TEMPERATURE_VOICE,
            top_p=1,
            max_tokens=settings.AI_MAX_TOKENS,
            stream=False
        )
        
        reply_text = completion.choices[0].message.content
        if detect_emergency(reply_text):
            is_emergency = True
            
        return {"reply": reply_text, "emergency": is_emergency}

    @staticmethod
    def process_chat(message: str, language: str, role: str, history: list):
        is_emergency = detect_emergency(message)
        lang_name = LANGUAGE_MAP.get(language, "English")
        
        system_msg = f"{SYSTEM_PROMPT}\n\nCRITICAL LANGUAGE RULE: You MUST reply ENTIRELY in {lang_name}.\n\nUser Role: {role}"
        
        medical_context = rag_pipeline.get_medical_context(message)
        if medical_context:
            system_msg += medical_context
            
        messages = [{"role": "system", "content": system_msg}]
        
        for msg in history[-10:]:
            api_role = "assistant" if msg.role == "assistant" else "user"
            messages.append({"role": api_role, "content": msg.text})
            
        messages.append({"role": "user", "content": message})
        
        completion = client.chat.completions.create(
            model=settings.AI_MODEL_CHAT,
            messages=messages,
            temperature=settings.AI_TEMPERATURE_CHAT,
            top_p=0.7,
            max_tokens=settings.AI_MAX_TOKENS,
            stream=False
        )
        
        reply_text = completion.choices[0].message.content
        if detect_emergency(reply_text):
            is_emergency = True
            
        return {"reply": reply_text, "emergency": is_emergency}

ai_service = AIService()
