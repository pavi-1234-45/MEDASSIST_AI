"""
Emergency detection utilities and shared constants.
Extracted from the original backend/main.py.
"""

# ──────────────────────────────────────────────────────────────────────
# Emergency keywords
# ──────────────────────────────────────────────────────────────────────
EMERGENCY_KEYWORDS = [
    "chest pain",
    "breathing difficulty",
    "unconscious",
    "unconsciousness",
    "stroke",
    "severe bleeding",
    "accident",
    "severe pain",
    "suicidal",
    "heart attack",
    "seizure",
    "choking",
    "anaphylaxis",
    "overdose",
    "not breathing",
]


def detect_emergency(text: str) -> bool:
    """Return True if the text contains emergency-related keywords."""
    text_lower = text.lower()
    return any(keyword in text_lower for keyword in EMERGENCY_KEYWORDS)


# ──────────────────────────────────────────────────────────────────────
# Language mapping
# ──────────────────────────────────────────────────────────────────────
LANGUAGE_MAP = {
    "en": "English",
    "ta": "Tamil",
    "hi": "Hindi",
    "kn": "Kannada",
    "ml": "Malayalam",
    "te": "Telugu",
}


# ──────────────────────────────────────────────────────────────────────
# System prompt
# ──────────────────────────────────────────────────────────────────────
SYSTEM_PROMPT = (
    "You are MedAssist AI, a multilingual healthcare assistant. "
    "Give general health guidance only. Do not provide final diagnosis. "
    "Do not prescribe medicine. Always recommend consulting a doctor for "
    "medical advice. If the user mentions emergency symptoms like chest pain, "
    "breathing difficulty, unconsciousness, stroke symptoms, severe bleeding, "
    "accident, severe pain, or suicidal thoughts, respond with an emergency "
    "warning and advise contacting emergency services or nearest hospital "
    "immediately."
)
