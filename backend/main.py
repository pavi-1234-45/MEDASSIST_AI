import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
from dotenv import load_dotenv
import re

# Load environment variables
load_dotenv()

# Setup API Key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY and GEMINI_API_KEY != "YOUR_GEMINI_API_KEY_HERE":
    genai.configure(api_key=GEMINI_API_KEY)

app = FastAPI()

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
    if not GEMINI_API_KEY or GEMINI_API_KEY == "YOUR_GEMINI_API_KEY_HERE":
        # Fallback if API key is not configured
        return VoiceResponse(
            reply="Please configure your GEMINI_API_KEY in the backend .env file.",
            emergency=False
        )
    
    try:
        # Determine emergency based on simple keyword search on transcript
        is_emergency = detect_emergency(req.message)
        
        # Configure the model
        model = genai.GenerativeModel('gemini-pro')
        
        # Build prompt enforcing language
        prompt = f"{SYSTEM_PROMPT}\n\nIMPORTANT LANGUAGE RULE: You MUST reply entirely in the language corresponding to language code '{req.language}'. If it's 'ta', reply in Tamil. If it's 'hi', reply in Hindi. If it's 'kn', reply in Kannada. If it's 'ml', reply in Malayalam. If it's 'te', reply in Telugu. If it's 'en', reply in English.\n\nUser Role: {req.role}\nUser Message: {req.message}"
        
        # Call Gemini
        response = model.generate_content(prompt)
        reply_text = response.text
        
        # Safety catch if Gemini itself detects emergency and returns a warning
        if detect_emergency(reply_text):
            is_emergency = True
            
        return VoiceResponse(
            reply=reply_text,
            emergency=is_emergency
        )
    except Exception as e:
        print(f"Error calling Gemini: {e}")
        raise HTTPException(status_code=500, detail="Failed to process voice request")

@app.get("/")
def read_root():
    return {"status": "MedAssist AI Backend Running"}
