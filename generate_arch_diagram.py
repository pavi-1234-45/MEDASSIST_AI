"""
MedAssist AI - Clean Technical Architecture Diagram
DESIGN PRINCIPLE: Less is more. Big boxes, big text, lots of whitespace.
Output: A4 Landscape PNG at 300 DPI.
"""
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, RegularPolygon

fig, ax = plt.subplots(1, 1, figsize=(20, 12))
ax.set_xlim(0, 100)
ax.set_ylim(0, 60)
ax.axis('off')
fig.patch.set_facecolor('white')

def box(x, y, w, h, label, fc='white', ec='#333', tc='#333', fs=8, lw=2):
    b = FancyBboxPatch((x, y), w, h, boxstyle='round,pad=0.4',
                       facecolor=fc, edgecolor=ec, linewidth=lw)
    ax.add_patch(b)
    ax.text(x+w/2, y+h/2, label, ha='center', va='center',
            fontsize=fs, color=tc, fontweight='bold', linespacing=1.4)

def section(x, y, w, h, title, ec='#333', fc='#fafafa'):
    bg = FancyBboxPatch((x, y), w, h, boxstyle='round,pad=0.5',
                        facecolor=fc, edgecolor=ec, linewidth=2.5, alpha=0.35)
    ax.add_patch(bg)
    border = FancyBboxPatch((x, y), w, h, boxstyle='round,pad=0.5',
                            facecolor='none', edgecolor=ec, linewidth=2.5)
    ax.add_patch(border)
    ax.text(x+w/2, y+h+1, title, ha='center', va='center', fontsize=11,
            fontweight='bold', color=ec,
            bbox=dict(boxstyle='round,pad=0.4', fc='white', ec=ec, lw=2))

def arrow(x1, y1, x2, y2, color='#555', lw=2.5, label=''):
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle='-|>', color=color, lw=lw))
    if label:
        mx, my = (x1+x2)/2, (y1+y2)/2
        ax.text(mx, my+1.2, label, fontsize=7, ha='center', color=color,
                fontweight='bold', fontstyle='italic',
                bbox=dict(boxstyle='round,pad=0.2', fc='white', ec=color, alpha=0.9))

# ── TITLE ──
ax.text(50, 58, 'MedAssist AI — Technical Architecture', fontsize=20,
        fontweight='bold', ha='center', color='#1B4F72')
ax.text(50, 56.2, 'React 18  •  FastAPI  •  Firebase  •  Firestore  •  Redis  •  NVIDIA NIM  •  WHO EML RAG  •  Blockchain',
        fontsize=8, ha='center', color='#7F8C8D', fontstyle='italic')

# ═══════════════════════════════════════════════
# COLUMN 1: CLIENT LAYER (x: 1-18)
# ═══════════════════════════════════════════════
section(1, 8, 16, 44, 'Frontend (React + Vite)', ec='#1565c0', fc='#e3f2fd')

box(2.5, 45, 13, 5, 'Patient Module\nDashboard  •  AI Assistant  •  Voice\nMedicines  •  Appointments  •  Emergency\nHospital Search  •  Reports  •  Profile',
    ec='#1976d2', tc='#1565c0', fs=8)

box(2.5, 38.5, 13, 5, 'Doctor Module\nDashboard  •  Patients  •  Notes\nAppointments  •  Adherence\nEmergencies  •  Settings',
    ec='#1976d2', tc='#1565c0', fs=8)

box(2.5, 32, 13, 5, 'Caregiver Module\nDashboard  •  Alerts  •  Reports\nPatient Status  •  Medicine Status\nAppointments  •  Emergencies',
    ec='#e67e22', tc='#d35400', fs=8)

box(2.5, 25.5, 13, 5, 'Admin Module\nDashboard  •  Patients  •  Doctors\nAppointments  •  Alerts\nReports  •  System Settings',
    ec='#8e44ad', tc='#7d3c98', fs=8)

box(2.5, 18.5, 13, 5.5, 'Shared Components\nAuthContext  •  LanguageContext (6 langs)\napiClient.js  •  firebaseService.js\nErrorBoundary  •  Layout  •  Router\nAccessibility  •  High Contrast  •  PWA',
    fc='#e8eaf6', ec='#3949ab', tc='#283593', fs=7)

box(2.5, 10, 13, 6.5, 'Environment Keys (.env)\nAI_API_KEY  •  WHISPER_API_KEY\nAI_MODEL_CHAT\nOPENFDA_API_KEY\nDATA_GOV_IN_API_KEY\nMEDI_CLIENT_ID  •  MEDI_CLIENT_SECRET\nREDIS_URL  •  FIREBASE_CREDENTIALS',
    fc='#fff8e1', ec='#e65100', tc='#bf360c', fs=7, lw=2)

# ═══════════════════════════════════════════════
# COLUMN 2: API GATEWAY + ROUTERS (x: 22-44)
# ═══════════════════════════════════════════════
section(22, 8, 20, 44, 'API Gateway (FastAPI)', ec='#388e3c', fc='#e8f5e9')

box(24, 46, 16, 4, 'FastAPI Server\nPython 3.10  •  Port 8000\nCORS  •  Rate Limiter  •  Logging',
    fc='#fff3e0', ec='#f57c00', tc='#e65100', fs=9)

# Routers - 2 columns, well spaced
routers = ['users.py', 'patients.py', 'doctors.py', 'appointments.py',
           'alerts.py', 'medicines.py', 'medical.py', 'ai.py',
           'reports.py', 'blockchain.py', 'health.py']
for i, name in enumerate(routers):
    col = i % 2
    row = i // 2
    rx = 24 + col * 8.5
    ry = 39 - row * 4.2
    box(rx, ry, 7, 3, name, ec='#388e3c', tc='#2e7d32', fs=9)

box(24, 10, 16, 4, 'Pydantic Schemas\nuser  •  patient  •  doctor  •  medicine\nalert  •  appointment  •  report  •  ai',
    fc='#e8f5e9', ec='#388e3c', tc='#2e7d32', fs=7)

# ═══════════════════════════════════════════════
# COLUMN 3: BUSINESS LOGIC + AI (x: 46-68)
# ═══════════════════════════════════════════════
section(46, 8, 20, 44, 'Business Logic & AI Engine', ec='#f57c00', fc='#fff3e0')

box(48, 46, 8, 4, 'ai_service.py\nChat\nEmergency\nDetection',
    ec='#f57c00', tc='#e65100', fs=8)
box(57.5, 46, 7, 4, 'ai_client.py\nNVIDIA NIM\nRetry Logic',
    ec='#f57c00', tc='#e65100', fs=8)

box(48, 39, 16.5, 5.5, 'RAG Pipeline\npipeline.py  +  eml_knowledge.py\n1,738 WHO Essential Medicines\nOpenFDA  •  RxNorm  •  Data.gov.in\nWHO ICD-11  •  MedlinePlus',
    fc='#fbe9e7', ec='#d84315', tc='#bf360c', fs=8)

box(48, 33, 8, 4.5, 'medi_service.py\nWHO ICD-11 API\nOAuth2 Auth',
    ec='#7b1fa2', tc='#6a1b9a', fs=8)
box(57.5, 33, 7, 4.5, 'blockchain.py\nSHA-256 Hash\nAudit Chain',
    ec='#6a1b9a', tc='#4a148c', fs=8)

box(48, 26.5, 8, 5, 'Notification\nEngine\nPush  •  SMS\nWhatsApp  •  IVR\nEmail',
    ec='#c62828', tc='#b71c1c', fs=8)
box(57.5, 26.5, 7, 5, 'Emergency\nUtils\nSOS Trigger\nHospital\nLookup',
    fc='#ffebee', ec='#c62828', tc='#b71c1c', fs=8)

box(48, 20, 16.5, 5, 'drug_api.py\nOpenFDA Labels  •  Adverse Events\nJan Aushadhi Generics (India)\nRxNorm Drug Identification',
    ec='#1565c0', tc='#0d47a1', fs=8)

box(48, 10, 16.5, 8, 'Test Suite\ntest_rag_pipeline.py\ntest_blockchain.py\ntest_security.py\ntest_entity_routers.py\ntest_medical_router.py\ntest_ai_router.py\nconftest.py',
    fc='#eceff1', ec='#546e7a', tc='#37474f', fs=7)

# ═══════════════════════════════════════════════
# COLUMN 4: DATA + EXTERNAL (x: 70-99)
# ═══════════════════════════════════════════════
section(70, 31, 28, 21, 'Data Persistence', ec='#d32f2f', fc='#fce4ec')

box(72, 44, 12, 6, 'Cloud Firestore\n(NoSQL)\nusers  •  patients  •  doctors\nmedicines  •  med_logs\nappointments  •  sos_events\nalerts  •  chats  •  reports',
    ec='#d32f2f', tc='#c62828', fs=7)
box(85.5, 44, 11, 6, 'Firestore (cont.)\naudit_logs\nconsent_records\nsystem_settings\nnotifications\nFirestore Security Rules\nComposite Indexes (15)',
    ec='#d32f2f', tc='#c62828', fs=7)

box(72, 33, 12, 8.5, 'Firebase Auth\nEmail / Password\nToken Management\nRole Assignment\nRBAC Enforcement',
    ec='#f57c00', tc='#e65100', fs=8)
box(85.5, 33, 11, 8.5, 'Redis Cache\nRAG Response\nCaching\nRate Limit\nCounters\nTTL Expiry',
    ec='#c62828', tc='#b71c1c', fs=8)

# External Services
section(70, 8, 28, 21, 'External Services & Cloud', ec='#7b1fa2', fc='#f3e5f5')

box(72, 23, 12, 4.5, 'NVIDIA NIM API\nllama-3.1-8b-instruct\ngpt-oss-120b\nWhisper STT (6 langs)',
    ec='#00695c', tc='#004d40', fs=8)
box(85.5, 23, 11, 4.5, 'Medical APIs\nOpenFDA\nWHO ICD-11\nRxNorm (NIH)\nData.gov.in',
    ec='#1565c0', tc='#0d47a1', fs=8)

box(72, 10, 12, 11, 'Cloud Infra\nGoogle Cloud Platform\nFirestore  •  Firebase Auth\nCloud Storage  •  FCM\nVercel (Frontend CDN)\nRender (Backend Docker)\ndocker-compose.yml\nDockerfile  •  build.sh\nrender.yaml  •  vercel.json',
    ec='#2c3e50', tc='#1a237e', fs=7)
box(85.5, 10, 11, 11, 'Communication\nFirebase Cloud\nMessaging (FCM)\nPush Notifications\nTwilio / MSG91\nSMS Gateway\nWhatsApp Gateway\nIVR Voice Calls\nMedlinePlus API\nWikipedia Medical',
    ec='#f57c00', tc='#e65100', fs=7)

# ═══════════════════════════════════════════════
# ARROWS (Clean, minimal)
# ═══════════════════════════════════════════════
arrow(17, 35, 22, 35, '#388e3c', 3, label='HTTPS / REST')
arrow(42, 35, 46, 35, '#f57c00', 3, label='Service Calls')
arrow(66, 40, 70, 40, '#d32f2f', 3, label='Firestore SDK')
arrow(66, 25, 70, 25, '#7b1fa2', 2.5, label='API Calls')

plt.tight_layout()
plt.savefig("MedAssist_AI_Technical_Architecture.png", dpi=300,
            bbox_inches='tight', facecolor='white')
plt.close()
print("Successfully saved: MedAssist_AI_Technical_Architecture.png")
