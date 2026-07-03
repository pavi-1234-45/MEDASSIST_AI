from pydantic import BaseModel
from typing import List, Optional

class ChatMessage(BaseModel):
    role: str
    text: str

class ChatRequest(BaseModel):
    message: str
    language: str
    role: str
    history: List[ChatMessage] = []

class VoiceRequest(BaseModel):
    message: str
    language: str
    role: str

class AIResponse(BaseModel):
    reply: str
    emergency: bool
