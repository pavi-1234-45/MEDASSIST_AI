<p align="center">
  <img src="https://img.shields.io/badge/MedAssist-AI-0ea5e9?style=for-the-badge&logo=heart-pulse&logoColor=white" alt="MedAssist AI" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/FastAPI-2.0-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Firebase-Auth%20%26%20Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
  <img src="https://img.shields.io/badge/NVIDIA-NIM%20API-76B900?style=for-the-badge&logo=nvidia&logoColor=white" alt="NVIDIA NIM" />
</p>

<h1 align="center">🏥 MedAssist AI</h1>

<p align="center">
  <strong>An AI-powered, multilingual healthcare assistant platform designed for patients, doctors, caregivers, and administrators.</strong>
</p>

<p align="center">
  MedAssist AI combines a Retrieval-Augmented Generation (RAG) pipeline backed by verified medical databases (WHO EML, OpenFDA, RxNorm, ICD-11) with role-based dashboards, appointment management, emergency SOS, blockchain-based audit trails, and multi-language support across 6 Indian languages.
</p>

---

## 📑 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Multi-Language Support](#-multi-language-support)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 🤖 AI Health Assistant
- **RAG-Powered Chat** — Context-aware medical conversations grounded in WHO Essential Medicines List, OpenFDA drug labels, RxNorm, ICD-11, and Wikipedia medical data.
- **Voice Assistant** — Concise, voice-optimized AI responses for hands-free interaction.
- **Emergency Detection** — Real-time keyword scanning to detect emergency symptoms (chest pain, stroke, seizure, etc.) and trigger SOS alerts.
- **Fallback Intelligence** — When the LLM is unavailable, the system still serves verified database context to the user.

### 👥 Role-Based Dashboards
| Role | Capabilities |
|------|-------------|
| **Patient** | Dashboard, AI Chat & Voice, Medicine search & reminders, Appointments, Emergency SOS, Health reports, Caregiver linking, Hospital search, WhatsApp/IVR support |
| **Doctor** | Patient management, Appointment scheduling, Clinical notes, Adherence tracking, Emergency alerts, Settings |
| **Caregiver** | Patient monitoring, Medicine status tracking, Alerts, Appointments, Emergency view, Reports |
| **Admin** | System-wide dashboard, Patient & Doctor management, Appointment oversight, Alert monitoring, Reports & analytics, System settings |

### 💊 Medicine & Medical Data
- **Medicine Search** — Search medicines with real-time data from OpenFDA and the WHO Essential Medicines List.
- **Drug Interaction Checks** — AI-powered analysis of potential drug interactions.
- **Hospital Search** — Find nearby hospitals and healthcare facilities.

### 🔗 Blockchain Audit Trail
- SHA-256 hashed medical records for tamper-proof integrity verification.
- Patient consent recording with simulated transaction IDs.
- Immutable audit event logging for all sensitive operations.

### 🚨 Emergency System
- One-tap SOS with automatic emergency contact notification.
- Real-time emergency detection in AI conversations.
- Doctor and caregiver emergency dashboards.

### 📅 Appointment Management
- Full CRUD for appointments across all roles.
- Doctor availability and scheduling.
- Status tracking (pending, confirmed, completed, cancelled).

### 🔐 Security
- Firebase Authentication (Email/Password, Google OAuth).
- JWT token verification with role-based access control.
- Rate limiting and Redis caching.
- CORS configuration with environment-based origins.

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (React 19 + Vite)                 │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌───────────────────┐  │
│  │ Patient  │ │ Doctor   │ │ Caregiver │ │ Admin Dashboard   │  │
│  │Dashboard │ │Dashboard │ │ Dashboard │ │                   │  │
│  └────┬─────┘ └────┬─────┘ └─────┬─────┘ └────────┬──────────┘  │
│       └────────────┼─────────────┼─────────────────┘            │
│                    ▼             ▼                               │
│         ┌─────────────────────────────┐                         │
│         │   AuthContext + Firebase SDK │                         │
│         └──────────────┬──────────────┘                         │
└────────────────────────┼────────────────────────────────────────┘
                         │  HTTPS / REST
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND (FastAPI + Uvicorn)                   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                     API Routers                          │   │
│  │  /ai  /medical  /users  /appointments  /patients         │   │
│  │  /doctors  /alerts  /medicines  /reports  /blockchain    │   │
│  └──────────────────────────┬───────────────────────────────┘   │
│                             ▼                                   │
│  ┌─────────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │   AI Service    │  │  Medi Service │  │ Blockchain Svc   │   │
│  │  (NVIDIA NIM)   │  │ (OpenFDA,WHO)│  │  (SHA-256 Hash)  │   │
│  └───────┬─────────┘  └──────────────┘  └──────────────────┘   │
│          ▼                                                      │
│  ┌─────────────────────────────────────┐                        │
│  │         RAG Pipeline                │                        │
│  │  WHO EML · OpenFDA · RxNorm · ICD-11│                        │
│  │  Wikipedia Medical · Data.gov.in    │                        │
│  └─────────────────────────────────────┘                        │
│                                                                 │
│  ┌─────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │   Firebase   │  │      Redis       │  │   Security       │   │
│  │ Admin SDK    │  │   Cache/Rate     │  │  JWT + RBAC      │   │
│  └─────────────┘  └──────────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 19** | UI framework |
| **Vite 8** | Build tool & dev server |
| **Tailwind CSS 4** | Utility-first styling |
| **React Router 7** | Client-side routing |
| **Framer Motion** | Animations & transitions |
| **Recharts** | Data visualization & charts |
| **Lucide React** | Icon system |
| **Firebase SDK** | Authentication & Firestore |
| **React Hot Toast** | Toast notifications |

### Backend
| Technology | Purpose |
|------------|---------|
| **FastAPI** | Async Python API framework |
| **Uvicorn** | ASGI server |
| **Pydantic** | Data validation & settings |
| **NVIDIA NIM API** | LLM inference (Llama 3.1 70B) |
| **Firebase Admin SDK** | Server-side auth & Firestore |
| **Redis** | Caching & rate limiting |
| **OpenAI SDK** | AI client wrapper for NVIDIA API |
| **HTTPX** | Async HTTP client |

### External Data Sources (RAG Pipeline)
| Source | Data |
|--------|------|
| **WHO EML** | Essential Medicines List (local JSON knowledge base) |
| **OpenFDA** | Drug labels, adverse events, recalls |
| **RxNorm** | Drug name normalization & interactions |
| **ICD-11** | Disease classification & coding |
| **Data.gov.in** | Indian healthcare facility data |
| **Wikipedia** | Medical article summaries |

---

## 📁 Project Structure

```
medassist-ai/
├── src/                          # React Frontend
│   ├── App.jsx                   # Root component with routing
│   ├── main.jsx                  # Entry point
│   ├── index.css                 # Global styles
│   ├── components/
│   │   ├── Layout.jsx            # App shell with sidebar navigation
│   │   ├── AppInitializer.jsx    # Auth state initialization
│   │   └── ErrorBoundary.jsx     # Error boundary wrapper
│   ├── context/
│   │   ├── AuthContext.jsx       # Firebase auth context provider
│   │   └── LanguageContext.jsx   # i18n language context
│   ├── pages/
│   │   ├── PatientDashboard.jsx  # Patient home dashboard
│   │   ├── DoctorDashboard.jsx   # Doctor home dashboard
│   │   ├── CaregiverDashboard.jsx# Caregiver home dashboard
│   │   ├── AdminDashboard.jsx    # Admin analytics dashboard
│   │   ├── Chat.jsx              # AI chat interface
│   │   ├── VoiceAssistant.jsx    # Voice assistant interface
│   │   ├── Emergency.jsx         # SOS emergency page
│   │   ├── Appointments.jsx      # Appointment management
│   │   ├── Reports.jsx           # Health reports
│   │   ├── Auth.jsx              # Login / Register page
│   │   ├── patient/              # Patient-specific pages
│   │   ├── doctor/               # Doctor-specific pages
│   │   ├── caregiver/            # Caregiver-specific pages
│   │   └── admin/                # Admin-specific pages
│   ├── firebase/
│   │   └── firebaseConfig.js     # Firebase project configuration
│   ├── locales/                  # Translation files
│   │   ├── en.json               # English
│   │   ├── hi.json               # Hindi
│   │   ├── ta.json               # Tamil
│   │   ├── te.json               # Telugu
│   │   ├── kn.json               # Kannada
│   │   └── ml.json               # Malayalam
│   ├── data/
│   │   ├── menuConfig.js         # Role-based navigation config
│   │   └── translations.js       # Inline translations fallback
│   └── utils/                    # Utility functions
│
├── backend/                      # FastAPI Backend
│   ├── main.py                   # Backend entry (imports app)
│   ├── requirements.txt          # Python dependencies
│   ├── Dockerfile                # Container configuration
│   ├── .env.example              # Environment variable template
│   ├── app/
│   │   ├── main.py               # FastAPI app factory & router mounting
│   │   ├── config/
│   │   │   └── settings.py       # Pydantic settings management
│   │   ├── routers/
│   │   │   ├── ai.py             # AI chat & voice endpoints
│   │   │   ├── medical.py        # Medical data endpoints
│   │   │   ├── users.py          # User management
│   │   │   ├── appointments.py   # Appointment CRUD
│   │   │   ├── patients.py       # Patient operations
│   │   │   ├── doctors.py        # Doctor operations
│   │   │   ├── alerts.py         # Alert management
│   │   │   ├── medicines.py      # Medicine search & data
│   │   │   ├── reports.py        # Report generation
│   │   │   ├── blockchain.py     # Blockchain audit endpoints
│   │   │   └── health.py         # Health check endpoint
│   │   ├── services/
│   │   │   ├── ai_service.py     # AI/LLM orchestration
│   │   │   ├── ai_client.py      # NVIDIA NIM API client with retry
│   │   │   ├── medi_service.py   # Medical data aggregation
│   │   │   └── blockchain.py     # Blockchain hash & audit service
│   │   ├── rag/
│   │   │   ├── pipeline.py       # Multi-source RAG pipeline
│   │   │   ├── eml_knowledge.py  # WHO EML knowledge base loader
│   │   │   └── eml_knowledge_base.json  # WHO EML dataset
│   │   ├── security/
│   │   │   └── auth.py           # JWT verification & RBAC
│   │   ├── schemas/              # Pydantic request/response models
│   │   ├── middleware/           # Custom middleware
│   │   ├── notifications/       # Notification handlers
│   │   ├── repositories/        # Data access layer
│   │   └── utils/               # Backend utilities
│   └── tests/
│       ├── conftest.py           # Pytest fixtures & test client
│       ├── test_ai_router.py     # AI endpoint tests
│       ├── test_blockchain.py    # Blockchain service tests
│       ├── test_entity_routers.py# CRUD router tests
│       ├── test_medical_router.py# Medical endpoint tests
│       ├── test_rag_pipeline.py  # RAG pipeline tests
│       └── test_security.py      # Auth & security tests
│
├── docker-compose.yml            # Multi-service Docker setup
├── vercel.json                   # Vercel deployment config
├── render.yaml                   # Render deployment config
├── build.sh                      # Production build script
├── package.json                  # Node.js dependencies
├── vite.config.js                # Vite build configuration
├── eslint.config.js              # ESLint configuration
└── .gitignore                    # Git ignore rules
```

---

## 📋 Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x
- **Python** >= 3.10
- **Redis** (optional, for caching & rate limiting)
- **Firebase Project** with Authentication & Firestore enabled
- **NVIDIA NIM API Key** (for LLM inference)

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/pavi-1234-45/MEDASSIST_AI.git
cd MEDASSIST_AI
```

### 2. Frontend Setup

```bash
# Install Node.js dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:5173`.

### 3. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create a virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your API keys and credentials

# Start the backend server
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.

### 4. Docker Setup (Optional)

```bash
# Start all services (backend + Redis)
docker-compose up --build
```

---

## 🔑 Environment Variables

Create a `backend/.env` file from the template:

```bash
cp backend/.env.example backend/.env
```

| Variable | Description | Required |
|----------|-------------|----------|
| `AI_API_KEY` | NVIDIA NIM API key | Yes |
| `AI_API_BASE_URL` | NVIDIA NIM endpoint | Yes |
| `AI_MODEL_CHAT` | Chat model (e.g., `meta/llama-3.1-70b-instruct`) | Yes |
| `AI_MODEL_VOICE` | Voice model | Yes |
| `OPENFDA_API_KEY` | OpenFDA API key | Optional |
| `DATA_GOV_IN_API_KEY` | Data.gov.in API key | Optional |
| `FIREBASE_CREDENTIALS_PATH` | Path to Firebase service account JSON | Yes |
| `REDIS_URL` | Redis connection URL | Optional |
| `RATE_LIMIT_PER_MINUTE` | API rate limit per minute | Optional |
| `BLOCKCHAIN_ENABLED` | Enable blockchain audit trail | Optional |
| `LOG_LEVEL` | Logging level (INFO, DEBUG, etc.) | Optional |

---

## 📡 API Reference

Base URL: `http://localhost:8000`

### Health Check
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Server health status |

### AI Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/ai/chat` | Send a message to the AI health assistant |
| `POST` | `/ai/voice` | Voice assistant interaction |

### Medical Data
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/medical/search` | Search medical information |
| `GET` | `/medicines/search` | Search medicines (OpenFDA + WHO EML) |

### User Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/users/register` | Register a new user |
| `GET` | `/users/profile` | Get current user profile |
| `PUT` | `/users/profile` | Update user profile |

### Appointments
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/appointments` | List appointments |
| `POST` | `/appointments` | Create an appointment |
| `PUT` | `/appointments/{id}` | Update an appointment |
| `DELETE` | `/appointments/{id}` | Cancel an appointment |

### Patients and Doctors
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/patients` | List patients |
| `GET` | `/patients/{id}` | Get patient details |
| `GET` | `/doctors` | List doctors |
| `GET` | `/doctors/{id}` | Get doctor details |

### Reports and Alerts
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/reports` | List health reports |
| `POST` | `/reports` | Generate a report |
| `GET` | `/alerts` | List alerts |

### Blockchain Audit
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/blockchain/hash` | Generate record hash |
| `POST` | `/blockchain/verify` | Verify record integrity |
| `POST` | `/blockchain/consent` | Record patient consent |
| `GET` | `/blockchain/audit-log` | Get audit trail |

---

## 🌐 Multi-Language Support

MedAssist AI supports **6 languages** with full UI localization:

| Code | Language | Script |
|------|----------|--------|
| `en` | English | Latin |
| `hi` | Hindi | Devanagari |
| `ta` | Tamil | Tamil |
| `te` | Telugu | Telugu |
| `kn` | Kannada | Kannada |
| `ml` | Malayalam | Malayalam |

Users select their preferred language at first launch. The AI assistant also responds in the selected language, enforced via system-prompt instructions to the LLM.

---

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Run all tests
pytest

# Run with verbose output
pytest -v

# Run specific test modules
pytest tests/test_ai_router.py
pytest tests/test_blockchain.py
pytest tests/test_rag_pipeline.py
pytest tests/test_security.py
pytest tests/test_entity_routers.py
```

### Test Coverage

| Module | Tests |
|--------|-------|
| AI Router | Chat/voice endpoint tests with mocked LLM |
| Blockchain | Hash generation, consent recording, integrity verification |
| RAG Pipeline | Multi-source context retrieval |
| Security | JWT verification, role-based access |
| Entity Routers | CRUD operations for patients, doctors, appointments |

---

## 🚢 Deployment

### Vercel (Frontend + Backend)

The project includes a `vercel.json` for multi-service deployment:
- **Frontend** — Vite SPA served from root
- **Backend** — FastAPI via Vercel Serverless Functions

```bash
# Deploy to Vercel
npx vercel --prod
```

### Render

A `render.yaml` blueprint is included:

```bash
# Deploy using Render Dashboard
# 1. Connect your GitHub repo
# 2. Render auto-detects the render.yaml blueprint
```

### Docker

```bash
# Production build
docker-compose up --build -d
```

The backend serves the built frontend SPA from the `dist/` directory when available.

---

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/my-feature`
3. **Commit** your changes: `git commit -m 'Add my feature'`
4. **Push** to the branch: `git push origin feature/my-feature`
5. **Open** a Pull Request

---

## 📄 License

This project is part of an academic/research initiative. Contact the repository owner for licensing information.

---

<p align="center">
  Built with ❤️ by the MedAssist AI Team
</p>
