import { 
  Home, MessageSquare, Mic, Bell, Calendar, 
  AlertTriangle, Users, Phone, User, FileText, Settings, Pill, Activity, Bot 
} from 'lucide-react';

export const patientMenu = [
  { labelKey: "dashboard", path: "/patient/dashboard", icon: Home },
  { labelKey: "my_medicines", path: "/patient/medicines", icon: Bell },
  { labelKey: "appointments", path: "/patient/appointments", icon: Calendar },
  { labelKey: "ai_health_assistant", path: "/patient/assistant", icon: Bot },
  { labelKey: "emergency", path: "/patient/emergency", icon: AlertTriangle },
  { labelKey: "caregiver", path: "/patient/caregiver", icon: Users },
  { labelKey: "profile", path: "/patient/profile", icon: User },
  { labelKey: "reports", path: "/patient/reports", icon: FileText },
  { labelKey: "settings", path: "/patient/settings", icon: Settings }
];

export const doctorMenu = [
  { labelKey: "dashboard", path: "/doctor/dashboard", icon: Home },
  { labelKey: "appointments", path: "/doctor/appointments", icon: Calendar },
  { labelKey: "emergency_requests", path: "/doctor/emergencies", icon: AlertTriangle },
  { labelKey: "patients", path: "/doctor/patients", icon: Users },
  { labelKey: "consultation_notes", path: "/doctor/notes", icon: FileText },
  { labelKey: "patient_adherence", path: "/doctor/adherence", icon: Activity },
  { labelKey: "settings", path: "/doctor/settings", icon: Settings }
];

export const caregiverMenu = [
  { labelKey: "dashboard", path: "/caregiver/dashboard", icon: Home },
  { labelKey: "alerts", path: "/caregiver/alerts", icon: Bell },
  { labelKey: "linked_patient", path: "/caregiver/patient", icon: User },
  { labelKey: "medicine_status", path: "/caregiver/medicine-status", icon: Pill },
  { labelKey: "appointments", path: "/caregiver/appointments", icon: Calendar },
  { labelKey: "emergency", path: "/caregiver/emergencies", icon: AlertTriangle },
  { labelKey: "reports", path: "/caregiver/reports", icon: FileText },
  { labelKey: "settings", path: "/caregiver/settings", icon: Settings }
];

export const adminMenu = [
  { labelKey: "dashboard", path: "/admin/dashboard", icon: Home },
  { labelKey: "patients", path: "/admin/patients", icon: Users },
  { labelKey: "appointments", path: "/admin/appointments", icon: Calendar },
  { labelKey: "alerts", path: "/admin/alerts", icon: Bell },
  { labelKey: "reports", path: "/admin/reports", icon: FileText },
  { labelKey: "doctors", path: "/admin/doctors", icon: User },
  { labelKey: "settings", path: "/admin/settings", icon: Settings }
];
