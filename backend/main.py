import os
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv
import re
from drug_api import router as drug_router

# Load environment variables
load_dotenv()

# Setup OpenAI Client for Nvidia API
client = OpenAI(
  base_url = "https://integrate.api.nvidia.com/v1",
  api_key = "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"
)

app = FastAPI()
app.include_router(drug_router)

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to frontend domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class VoiceRequest(BaseModel):
    message: str
    language: str
    role: str

class VoiceResponse(BaseModel):
    reply: str
    emergency: bool

# Emergency Keywords
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

SYSTEM_PROMPT = """You are MedAssist AI, a multilingual healthcare assistant. Give general health guidance only. Do not provide final diagnosis. Do not prescribe medicine. Always recommend consulting a doctor for medical advice. If the user mentions emergency symptoms like chest pain, breathing difficulty, unconsciousness, stroke symptoms, severe bleeding, accident, severe pain, or suicidal thoughts, respond with an emergency warning and advise contacting emergency services or nearest hospital immediately."""

@app.post("/ai/voice-assistant", response_model=VoiceResponse)
async def process_voice_assistant(req: VoiceRequest):
    try:
        # Determine emergency based on simple keyword search on transcript
        is_emergency = detect_emergency(req.message)
        
        # Build prompt enforcing language
        prompt = f"{SYSTEM_PROMPT}\n\nIMPORTANT LANGUAGE RULE: You MUST reply entirely in the language corresponding to language code '{req.language}'. If it's 'ta', reply in Tamil. If it's 'hi', reply in Hindi. If it's 'kn', reply in Kannada. If it's 'ml', reply in Malayalam. If it's 'te', reply in Telugu. If it's 'en', reply in English.\n\nUser Role: {req.role}\nUser Message: {req.message}"
        
        # Call Nvidia API using OpenAI client
        completion = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[{"role": "user", "content": prompt}],
            temperature=1,
            top_p=1,
            max_tokens=4096,
            stream=False
        )
        
        reply_text = completion.choices[0].message.content
        reasoning = getattr(completion.choices[0].message, "reasoning_content", None)
        if reasoning:
            print("Reasoning:", reasoning)
        
        # Safety catch if model itself detects emergency and returns a warning
        if detect_emergency(reply_text):
            is_emergency = True
            
        return VoiceResponse(
            reply=reply_text,
            emergency=is_emergency
        )
    except Exception as e:
        print(f"Error calling AI: {e}")
        raise HTTPException(status_code=500, detail="Failed to process voice request")

# --- Chat endpoint for the AI Health Assistant chatbot ---
class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    text: str

class ChatRequest(BaseModel):
    message: str
    language: str
    role: str
    history: list[ChatMessage] = []

class ChatResponse(BaseModel):
    reply: str
    emergency: bool

LANGUAGE_MAP = {
    "en": "English",
    "ta": "Tamil",
    "hi": "Hindi",
    "kn": "Kannada",
    "ml": "Malayalam",
    "te": "Telugu",
}

@app.post("/ai/chat", response_model=ChatResponse)
async def process_chat(req: ChatRequest):
    try:
        is_emergency = detect_emergency(req.message)
        
        lang_name = LANGUAGE_MAP.get(req.language, "English")
        
        system_msg = f"""{SYSTEM_PROMPT}

CRITICAL LANGUAGE RULE: You MUST reply ENTIRELY in {lang_name} (language code: '{req.language}'). Every single word of your response must be in {lang_name}. Do NOT use English unless the language code is 'en'. This is non-negotiable.

User Role: {req.role}"""
        
        # Build conversation history for context
        messages = [{"role": "system", "content": system_msg}]
        
        for msg in req.history[-10:]:  # Keep last 10 messages for context
            api_role = "assistant" if msg.role == "assistant" else "user"
            messages.append({"role": api_role, "content": msg.text})
        
        messages.append({"role": "user", "content": req.message})
        
        completion = client.chat.completions.create(
            model="meta/llama-3.1-70b-instruct",
            messages=messages,
            temperature=0.7,
            top_p=1,
            max_tokens=4096,
            stream=False
        )
        
        reply_text = completion.choices[0].message.content
        reasoning = getattr(completion.choices[0].message, "reasoning_content", None)
        if reasoning:
            print("Reasoning:", reasoning)
        
        if detect_emergency(reply_text):
            is_emergency = True
            
        return ChatResponse(
            reply=reply_text,
            emergency=is_emergency
        )
    except Exception as e:
        print(f"Error calling AI chat: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process chat request: {str(e)}")

dist_dir = os.path.join(os.path.dirname(__file__), "..", "dist")

if os.path.exists(dist_dir):
    # Mount assets folder directly
    app.mount("/assets", StaticFiles(directory=os.path.join(dist_dir, "assets")), name="assets")
    
    # Catch-all route for SPA fallback
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = os.path.join(dist_dir, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(dist_dir, "index.html"))
else:
    @app.get("/")
    def read_root():
        return {"status": "MedAssist AI Backend Running (Frontend build not found)"}
