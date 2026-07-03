import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.routers import ai, medical, users, appointments
from app.config.settings import settings

app = FastAPI(
    title="MedAssist AI Enterprise API",
    description="Enterprise backend for MedAssist AI",
    version="2.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(ai.router)
app.include_router(medical.router)
app.include_router(users.router)
app.include_router(appointments.router)

# Serve Frontend if dist exists
dist_dir = os.path.join(os.path.dirname(__file__), "..", "..", "dist")
if os.path.exists(dist_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(dist_dir, "assets")), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = os.path.join(dist_dir, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(dist_dir, "index.html"))
else:
    @app.get("/")
    def root():
        return {"message": "MedAssist AI Enterprise Backend Running (Frontend build not found)"}
