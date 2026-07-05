import sys
import os

# Add the backend directory to the Python path so that 'app' module imports
# (e.g., 'from app.routers import ...') resolve correctly within the
# backend codebase without needing to rewrite all imports.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.main import app  # noqa: E402
