"""
Legacy entry point — redirects to the new modular application.
Preserves backward compatibility with render.yaml:
    uvicorn backend.main:app --host 0.0.0.0 --port $PORT
"""
from backend.app.main import app  # noqa: F401
