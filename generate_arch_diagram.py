"""
Generate a high-resolution Technical Architecture Diagram (PNG) for MedAssist AI.
Left-to-right flow: Client → Presentation → API Gateway → Business Logic → Data → External Services
"""
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import os

OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "diagrams")
os.makedirs(OUT_DIR, exist_ok=True)

def draw_box(ax, x, y, w, h, label, color, fontcolor='white', fontsize=7, style='round,pad=0.04', lw=1.2, alpha=1.0):
    box = FancyBboxPatch((x, y), w, h, boxstyle=style, facecolor=color, edgecolor='#2C3E50', linewidth=lw, alpha=alpha)
    ax.add_patch(box)
    ax.text(x + w/2, y + h/2, label, ha='center', va='center', fontsize=fontsize,
            color=fontcolor, fontweight='bold', wrap=True,
            bbox=dict(boxstyle='round,pad=0.02', facecolor='none', edgecolor='none'))
    return (x, y, w, h)

def draw_arrow(ax, x1, y1, x2, y2, color='#2C3E50', lw=2, style='->', label='', dashed=False):
    ls = '--' if dashed else '-'
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle='-|>', color=color, lw=lw, linestyle=ls))
    if label:
        mx, my = (x1+x2)/2, (y1+y2)/2
        ax.text(mx, my + 0.3, label, fontsize=5.5, ha='center', va='center', color=color,
                fontweight='bold', fontstyle='italic',
                bbox=dict(boxstyle='round,pad=0.1', facecolor='white', edgecolor=color, alpha=0.9))

fig, ax = plt.subplots(1, 1, figsize=(28, 14))
ax.set_xlim(-0.5, 28)
ax.set_ylim(-1, 14)
ax.axis('off')

# ── Title ──
ax.text(14, 13.5, 'MedAssist AI - Technical Architecture Diagram',
        fontsize=18, fontweight='bold', ha='center', va='center', color='#1B4F72')
ax.text(14, 13.0, 'Left-to-Right Data Flow: Client > Presentation > API Gateway > Business Logic > Data > External Services',
        fontsize=9, ha='center', va='center', color='#7F8C8D', fontstyle='italic')

# ═══════════════════════════════════════════════════════════
# LAYER BACKGROUNDS (left to right)
# ═══════════════════════════════════════════════════════════
layers = [
    (0, 0.2, 3.8, 12.3, '#F8F9F9', '#BDC3C7', 'CLIENT\nLAYER', '#1B4F72'),
    (4.2, 0.2, 4.3, 12.3, '#EBF5FB', '#2980B9', 'PRESENTATION\nLAYER', '#2980B9'),
    (8.9, 0.2, 3.5, 12.3, '#FEF9E7', '#F39C12', 'API GATEWAY\nLAYER', '#F39C12'),
    (12.8, 0.2, 4.8, 12.3, '#F4ECF7', '#8E44AD', 'BUSINESS LOGIC\nLAYER', '#8E44AD'),
    (18.0, 0.2, 3.2, 12.3, '#EAFAF1', '#27AE60', 'DATA\nLAYER', '#27AE60'),
    (21.6, 0.2, 5.8, 12.3, '#FDEDEC', '#E74C3C', 'EXTERNAL\nSERVICES', '#E74C3C'),
]

for lx, ly, lw, lh, fc, ec, title, tc in layers:
    bg = FancyBboxPatch((lx, ly), lw, lh, boxstyle='round,pad=0.1', facecolor=fc, edgecolor=ec, linewidth=2, alpha=0.5)
    ax.add_patch(bg)
    # Title bar
    tb = FancyBboxPatch((lx+0.2, ly+lh-0.6), lw-0.4, 0.45, boxstyle='round,pad=0.05', facecolor=tc, edgecolor=tc, linewidth=1)
    ax.add_patch(tb)
    ax.text(lx+lw/2, ly+lh-0.38, title, ha='center', va='center', fontsize=8, fontweight='bold', color='white')

# ═══════════════════════════════════════════════════════════
# LAYER 1: CLIENT
# ═══════════════════════════════════════════════════════════
draw_box(ax, 0.4, 10.5, 1.4, 0.7, 'Patient\nUser', '#3498DB', fontsize=7)
draw_box(ax, 1.2, 10.5, 1.4, 0.7, 'Doctor\nUser', '#27AE60', fontsize=7)
draw_box(ax, 2.0, 10.5, 1.4, 0.7, 'Caregiver\nUser', '#E67E22', fontsize=7)

draw_box(ax, 0.3, 9.2, 1.5, 0.8, 'Web\nBrowser', '#D5F5E3', '#1E8449', fontsize=7)
draw_box(ax, 2.0, 9.2, 1.5, 0.8, 'Mobile\nBrowser (PWA)', '#D6EAF8', '#2471A3', fontsize=7)

draw_box(ax, 0.3, 7.9, 1.5, 0.7, 'Voice Input\n(Whisper STT)', '#FADBD8', '#C0392B', fontsize=6.5)
draw_box(ax, 2.0, 7.9, 1.5, 0.7, 'WhatsApp\n/ IVR / SMS', '#D5F5E3', '#1E8449', fontsize=6.5)

draw_box(ax, 0.8, 6.8, 2.2, 0.7, 'SOS Emergency\nTrigger Button', '#E74C3C', 'white', fontsize=7)

draw_box(ax, 0.3, 5.5, 3.2, 0.6, 'Multilingual: EN | HI | TA | KN | ML | TE', '#F5EEF8', '#6C3483', fontsize=6)
draw_box(ax, 0.3, 4.6, 3.2, 0.6, 'Accessibility: High Contrast | Large Font', '#EBEDEF', '#566573', fontsize=6)

# ═══════════════════════════════════════════════════════════
# LAYER 2: PRESENTATION (React Frontend)
# ═══════════════════════════════════════════════════════════
draw_box(ax, 4.5, 11.5, 3.7, 0.4, 'React 18 + Vite + React Router', '#2980B9', 'white', fontsize=7)

draw_box(ax, 4.5, 10.5, 1.7, 0.7, 'Auth Module\n(AuthContext.jsx)\nFirebase Auth', '#FFFFFF', '#2C3E50', fontsize=6, lw=0.8)
draw_box(ax, 6.5, 10.5, 1.7, 0.7, 'i18n Module\n(LanguageContext)\n6 Languages', '#FFFFFF', '#8E44AD', fontsize=6, lw=0.8)

draw_box(ax, 4.5, 9.5, 1.7, 0.6, 'Patient\nDashboard', '#D6EAF8', '#2471A3', fontsize=6.5, lw=0.8)
draw_box(ax, 6.5, 9.5, 1.7, 0.6, 'Doctor\nDashboard', '#D5F5E3', '#1E8449', fontsize=6.5, lw=0.8)
draw_box(ax, 4.5, 8.6, 1.7, 0.6, 'Caregiver\nDashboard', '#FDF2E9', '#CA6F1E', fontsize=6.5, lw=0.8)
draw_box(ax, 6.5, 8.6, 1.7, 0.6, 'Admin\nDashboard', '#F4ECF7', '#6C3483', fontsize=6.5, lw=0.8)

draw_box(ax, 4.5, 7.6, 1.7, 0.65, 'AI Medical\nChat (Chat.jsx)', '#FDEBD0', '#D68910', fontsize=6.5, lw=0.8)
draw_box(ax, 6.5, 7.6, 1.7, 0.65, 'Voice Assistant\n(VoiceAssistant)', '#FADBD8', '#C0392B', fontsize=6.5, lw=0.8)

draw_box(ax, 4.5, 6.6, 1.7, 0.65, 'Medicine\nManager', '#D5F5E3', '#27AE60', fontsize=6.5, lw=0.8)
draw_box(ax, 6.5, 6.6, 1.7, 0.65, 'Appointment\nBooking', '#D6EAF8', '#2471A3', fontsize=6.5, lw=0.8)

draw_box(ax, 4.5, 5.6, 1.7, 0.65, 'Emergency\nSOS Module', '#E74C3C', 'white', fontsize=6.5, lw=0.8)
draw_box(ax, 6.5, 5.6, 1.7, 0.65, 'Reports &\nAnalytics', '#EBEDEF', '#566573', fontsize=6.5, lw=0.8)

draw_box(ax, 4.5, 4.8, 3.7, 0.45, 'WhatsApp / IVR Integration', '#D5F5E3', '#1E8449', fontsize=6.5)

draw_box(ax, 4.5, 3.9, 3.7, 0.4, 'Layout | ErrorBoundary | AppInitializer', '#2980B9', 'white', fontsize=6.5)
draw_box(ax, 4.5, 3.2, 3.7, 0.4, 'State: React Context + Firebase SDK v9', '#1A5276', 'white', fontsize=6.5)

# ═══════════════════════════════════════════════════════════
# LAYER 3: API GATEWAY
# ═══════════════════════════════════════════════════════════
draw_box(ax, 9.2, 11.3, 2.9, 0.6, 'FastAPI Server\nPython 3.10+ | Port 8000', '#F39C12', 'white', fontsize=7)

draw_box(ax, 9.2, 10.5, 1.35, 0.45, 'CORS\nMiddleware', '#FFFFFF', '#F39C12', fontsize=6, lw=0.8)
draw_box(ax, 10.75, 10.5, 1.35, 0.45, 'Auth Middleware\n(Firebase Token)', '#FFFFFF', '#E74C3C', fontsize=5.5, lw=0.8)
draw_box(ax, 9.2, 9.8, 1.35, 0.45, 'Rate Limiter', '#FFFFFF', '#8E44AD', fontsize=6, lw=0.8)
draw_box(ax, 10.75, 9.8, 1.35, 0.45, 'Error Handler', '#FFFFFF', '#566573', fontsize=6, lw=0.8)

ax.text(10.65, 9.5, 'REST API Routes', fontsize=7, ha='center', va='center', color='#D68910', fontweight='bold', fontstyle='italic')

routes = [
    ('/api/ai/*', '#FDEBD0', '#E67E22'), ('/api/patients/*', '#D6EAF8', '#2471A3'),
    ('/api/doctors/*', '#D5F5E3', '#1E8449'), ('/api/medicines/*', '#D5F5E3', '#27AE60'),
    ('/api/appointments/*', '#D6EAF8', '#2471A3'), ('/api/alerts/*', '#FDF2E9', '#CA6F1E'),
    ('/api/medical/*', '#FDEBD0', '#E67E22'), ('/api/reports/*', '#EBEDEF', '#566573'),
    ('/api/blockchain/*', '#F4ECF7', '#6C3483'), ('/api/users/*', '#D6EAF8', '#2980B9'),
]
for i, (name, fc, tc) in enumerate(routes):
    row = i // 2
    col = i % 2
    rx = 9.2 + col * 1.5
    ry = 9.0 - row * 0.55
    draw_box(ax, rx, ry, 1.35, 0.45, name, fc, tc, fontsize=5.5, lw=0.8)

draw_box(ax, 9.2, 5.8, 2.9, 0.5, '/api/health\nServer Status', '#D5F5E3', '#1E8449', fontsize=6)

draw_box(ax, 9.2, 4.9, 2.9, 0.5, 'Deploy: Vercel (api/) + Render (backend/)', '#D68910', 'white', fontsize=6)

# ═══════════════════════════════════════════════════════════
# LAYER 4: BUSINESS LOGIC
# ═══════════════════════════════════════════════════════════
draw_box(ax, 13.1, 10.8, 2.1, 0.9, 'AI Service\n(ai_service.py)\nChat + Emergency\nDetection', '#FFFFFF', '#E67E22', fontsize=6, lw=0.8)
draw_box(ax, 15.5, 10.8, 2.0, 0.9, 'AI Client\n(ai_client.py)\nNVIDIA NIM API\nRetry Logic', '#FFFFFF', '#E67E22', fontsize=6, lw=0.8)

draw_box(ax, 13.1, 9.0, 2.1, 1.4, 'RAG Pipeline\n(pipeline.py)\n- WHO EML (local)\n- OpenFDA\n- RxNorm\n- Data.gov.in\n- ICD-11\n- MedlinePlus\n- Redis Cache', '#FDEBD0', '#D68910', fontsize=5.5, lw=1)
draw_box(ax, 15.5, 9.5, 2.0, 0.7, 'EML Knowledge\n1,738 WHO Medicines\nLocal JSON Index', '#FDEBD0', '#D68910', fontsize=6, lw=0.8)

draw_box(ax, 15.5, 8.4, 2.0, 0.8, 'Medi Service\n(medi_service.py)\nICD-11 + OAuth', '#FFFFFF', '#8E44AD', fontsize=6, lw=0.8)

draw_box(ax, 13.1, 7.4, 2.1, 0.9, 'Blockchain\nService\nSHA-256 Hashing\nAudit Chain', '#FFFFFF', '#6C3483', fontsize=6, lw=0.8)

draw_box(ax, 15.5, 7.0, 2.0, 0.9, 'Notification\nEngine\nPush | SMS | WhatsApp\nIVR | Email', '#FFFFFF', '#E74C3C', fontsize=6, lw=0.8)

draw_box(ax, 13.1, 5.5, 4.4, 0.8, 'Business Rules Engine\nStatus Transitions | Adherence Calc\nHealth Score | RBAC | Validation', '#F4ECF7', '#6C3483', fontsize=6)

draw_box(ax, 13.1, 4.4, 4.4, 0.5, 'Repository Layer: patients | doctors | medicines | alerts | appointments | reports', '#8E44AD', 'white', fontsize=5.5)

# ═══════════════════════════════════════════════════════════
# LAYER 5: DATA
# ═══════════════════════════════════════════════════════════
draw_box(ax, 18.3, 10.5, 2.6, 0.8, 'Google Cloud\nFirestore (NoSQL)', '#F39C12', 'white', fontsize=8)

# Collections
cols_text = 'Collections (28):\nusers | patients\ndoctors | caregivers\nmedicines | med_logs\nappointments\nsos_events | alerts\nchats | notifications\nreports | audit_logs\nconsent_records\nsystem_settings'
draw_box(ax, 18.3, 7.0, 2.6, 3.2, cols_text, '#FFFFFF', '#27AE60', fontsize=5.5, lw=0.8)

draw_box(ax, 18.3, 5.8, 2.6, 0.7, 'Firebase Auth\nEmail/Password\nToken Mgmt', '#E74C3C', 'white', fontsize=6)

draw_box(ax, 18.3, 4.7, 2.6, 0.7, 'Redis Cache\nRAG Response Cache\nTTL Expiry', '#E74C3C', 'white', fontsize=6)

draw_box(ax, 18.3, 3.6, 2.6, 0.55, 'Firestore Security Rules\nRBAC + Soft Delete', '#27AE60', 'white', fontsize=6)
draw_box(ax, 18.3, 2.8, 2.6, 0.5, 'Composite Indexes (15)', '#D5F5E3', '#1E8449', fontsize=6)

# ═══════════════════════════════════════════════════════════
# LAYER 6: EXTERNAL SERVICES
# ═══════════════════════════════════════════════════════════
ax.text(24.5, 11.7, 'AI / LLM Services', fontsize=7, ha='center', va='center', color='#C0392B', fontweight='bold', fontstyle='italic')
draw_box(ax, 22.0, 10.7, 5.0, 0.7, 'NVIDIA NIM API\nmeta/llama-3.1-8b-instruct | openai/gpt-oss-120b', '#FFFFFF', '#1ABC9C', fontsize=6, lw=0.8)
draw_box(ax, 22.0, 9.8, 5.0, 0.55, 'OpenAI Whisper API  |  Speech-to-Text (6 languages)', '#FFFFFF', '#1ABC9C', fontsize=6, lw=0.8)

ax.text(24.5, 9.5, 'Medical Data APIs', fontsize=7, ha='center', va='center', color='#C0392B', fontweight='bold', fontstyle='italic')
draw_box(ax, 22.0, 8.7, 5.0, 0.55, 'OpenFDA API  |  Drug labels, adverse events, warnings', '#FFFFFF', '#3498DB', fontsize=6, lw=0.8)
draw_box(ax, 22.0, 7.9, 5.0, 0.55, 'WHO ICD-11 API  |  Disease classification and coding', '#FFFFFF', '#3498DB', fontsize=6, lw=0.8)
draw_box(ax, 22.0, 7.1, 5.0, 0.55, 'RxNorm API (NIH/NLM)  |  Drug identification via RxCUI', '#FFFFFF', '#3498DB', fontsize=6, lw=0.8)
draw_box(ax, 22.0, 6.3, 5.0, 0.55, 'Data.gov.in API  |  Jan Aushadhi generics, Indian hospitals', '#FFFFFF', '#3498DB', fontsize=6, lw=0.8)
draw_box(ax, 22.0, 5.5, 5.0, 0.55, 'MedlinePlus / Wikipedia  |  Medical encyclopedia', '#FFFFFF', '#3498DB', fontsize=6, lw=0.8)

ax.text(24.5, 5.2, 'Communication APIs', fontsize=7, ha='center', va='center', color='#C0392B', fontweight='bold', fontstyle='italic')
draw_box(ax, 22.0, 4.4, 5.0, 0.55, 'Firebase Cloud Messaging (FCM)  |  Push notifications', '#FFFFFF', '#F39C12', fontsize=6, lw=0.8)
draw_box(ax, 22.0, 3.6, 5.0, 0.55, 'Twilio / MSG91  |  SMS + WhatsApp + IVR', '#FFFFFF', '#F39C12', fontsize=6, lw=0.8)

ax.text(24.5, 3.3, 'Cloud Infrastructure', fontsize=7, ha='center', va='center', color='#C0392B', fontweight='bold', fontstyle='italic')
draw_box(ax, 22.0, 2.3, 2.4, 0.7, 'Vercel\nFrontend CDN\n+ Serverless API', '#FFFFFF', '#2C3E50', fontsize=6, lw=0.8)
draw_box(ax, 24.6, 2.3, 2.4, 0.7, 'Render\nBackend Docker\nDeploy', '#FFFFFF', '#2C3E50', fontsize=6, lw=0.8)
draw_box(ax, 22.0, 1.3, 5.0, 0.65, 'Google Cloud Platform\nFirestore | Auth | Storage | FCM', '#4285F4', 'white', fontsize=7)

# ═══════════════════════════════════════════════════════════
# FLOW ARROWS (Left to Right)
# ═══════════════════════════════════════════════════════════
# Client → Presentation
draw_arrow(ax, 3.5, 9.6, 4.5, 9.8, '#2980B9', 3, label='HTTPS')
draw_arrow(ax, 3.5, 8.2, 4.5, 8.0, '#E67E22', 2, label='Voice')
draw_arrow(ax, 3.5, 7.1, 4.5, 5.9, '#E74C3C', 2, label='SOS')

# Presentation → API Gateway
draw_arrow(ax, 8.2, 7.5, 9.2, 9.0, '#F39C12', 3, label='REST API\nJSON + JWT')

# API Gateway → Business Logic
draw_arrow(ax, 12.1, 9.0, 13.1, 10.2, '#8E44AD', 3, label='Service\nCalls')

# Business Logic → Data Layer
draw_arrow(ax, 17.5, 4.6, 18.3, 8.0, '#27AE60', 3, label='Firestore\nSDK')

# Business Logic → External APIs
draw_arrow(ax, 17.5, 11.2, 22.0, 11.0, '#76D7C4', 2, label='LLM Inference', dashed=True)
draw_arrow(ax, 17.5, 9.5, 22.0, 9.0, '#3498DB', 2, label='RAG Queries', dashed=True)
draw_arrow(ax, 17.5, 7.4, 22.0, 4.7, '#F39C12', 2, label='Notifications', dashed=True)

# Data → GCP
draw_arrow(ax, 20.9, 5.5, 22.0, 1.8, '#4285F4', 2, label='GCP')

# ═══════════════════════════════════════════════════════════
# LEGEND
# ═══════════════════════════════════════════════════════════
legend_items = [
    mpatches.Patch(color='#EBF5FB', label='Presentation (React + Vite)', edgecolor='#2980B9'),
    mpatches.Patch(color='#FEF9E7', label='API Gateway (FastAPI)', edgecolor='#F39C12'),
    mpatches.Patch(color='#F4ECF7', label='Business Logic (Services + RAG)', edgecolor='#8E44AD'),
    mpatches.Patch(color='#EAFAF1', label='Data (Firestore + Redis)', edgecolor='#27AE60'),
    mpatches.Patch(color='#FDEDEC', label='External Services (APIs + Cloud)', edgecolor='#E74C3C'),
]
ax.legend(handles=legend_items, loc='lower left', fontsize=7, framealpha=0.95,
          bbox_to_anchor=(0.0, -0.02), ncol=5)

# ── Tech Stack Footer ──
footer = FancyBboxPatch((-0.3, -0.8), 27.8, 0.5, boxstyle='round,pad=0.05',
                        facecolor='#1B4F72', edgecolor='#0E2F44', linewidth=1)
ax.add_patch(footer)
ax.text(14, -0.55,
        'Tech Stack: React 18 | Vite | React Router | Firebase Auth | FastAPI | Python 3.10 | '
        'Firestore | Redis | NVIDIA NIM | OpenAI Whisper | Docker | Vercel | Render | OpenFDA | WHO ICD-11 | RxNorm',
        fontsize=8, ha='center', va='center', color='white', fontweight='bold')

plt.tight_layout()
out_path = os.path.join(OUT_DIR, "MedAssist_AI_Technical_Architecture.png")
plt.savefig(out_path, dpi=200, bbox_inches='tight', facecolor='white')
plt.close()
print(f"Saved: {out_path}")
