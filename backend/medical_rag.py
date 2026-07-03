"""
Legacy RAG module — delegates to the new modular pipeline.
Kept for backward compatibility with direct `python main.py` invocations.
"""
from app.rag.pipeline import rag_pipeline

def get_medical_context(message: str) -> str:
    return rag_pipeline.get_medical_context(message)
