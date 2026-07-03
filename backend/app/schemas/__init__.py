from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.schemas.patient import PatientCreate, PatientResponse, PatientUpdate
from app.schemas.doctor import DoctorCreate, DoctorResponse
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentResponse,
    AppointmentStatusUpdate,
)
from app.schemas.alert import AlertCreate, AlertResponse, AlertStatusUpdate
from app.schemas.medicine import MedicineCreate, MedicineResponse
from app.schemas.report import ReportCreate, ReportResponse
from app.schemas.ai import (
    ChatRequest,
    AIResponse,
    ChatMessage,
    VoiceRequest,
)
from app.schemas.blockchain import (
    AuditLogCreate,
    AuditLogResponse,
    ConsentCreate,
    ConsentResponse,
    ConsentVerify,
)
__all__ = [
    "UserCreate", "UserResponse", "UserUpdate",
    "PatientCreate", "PatientResponse", "PatientUpdate",
    "DoctorCreate", "DoctorResponse",
    "AppointmentCreate", "AppointmentResponse", "AppointmentStatusUpdate",
    "AlertCreate", "AlertResponse", "AlertStatusUpdate",
    "MedicineCreate", "MedicineResponse",
    "ReportCreate", "ReportResponse",
    "ChatRequest", "AIResponse", "ChatMessage",
    "VoiceRequest",
    "AuditLogCreate", "AuditLogResponse",
    "ConsentCreate", "ConsentResponse", "ConsentVerify",
]
