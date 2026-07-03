import { apiJson } from './apiClient';

/**
 * Data Service — bridges the frontend to the backend REST API.
 *
 * Function signatures and return shapes are identical to the original
 * localStorage-based implementation so NO component changes are needed.
 * Falls back to localStorage if the backend is unreachable.
 */

// ── Seed mock data (no-op when backend is available) ────────────────
export const seedMockData = () => {
  // Seed localStorage as fallback in case the backend is unavailable.
  if (!localStorage.getItem('medassist_patients')) {
    localStorage.setItem('medassist_patients', JSON.stringify([
      { id: 'p1', name: 'John Doe', age: 45, gender: 'Male', phone: '1234567890', condition: 'Diabetes', caregiver: 'Jane Doe', adherence: 85, lastAlert: '2 hours ago', status: 'Active' },
      { id: 'p2', name: 'Alice Smith', age: 62, gender: 'Female', phone: '0987654321', condition: 'Hypertension', caregiver: 'Bob Smith', adherence: 60, lastAlert: '1 day ago', status: 'Needs Attention' },
      { id: 'p3', name: 'Michael Johnson', age: 34, gender: 'Male', phone: '5551234567', condition: 'Asthma', caregiver: 'Sarah Johnson', adherence: 95, lastAlert: 'None', status: 'Stable' },
      { id: 'p4', name: 'Emma Brown', age: 78, gender: 'Female', phone: '5559876543', condition: 'Arthritis', caregiver: 'Tom Brown', adherence: 40, lastAlert: '5 mins ago', status: 'Critical' }
    ]));
  }

  if (!localStorage.getItem('medassist_doctors')) {
    localStorage.setItem('medassist_doctors', JSON.stringify([
      { id: 'd1', name: 'Dr. Sarah Wilson', specialization: 'Cardiologist', hospital: 'City General', appointments: 12, emergencies: 2 },
      { id: 'd2', name: 'Dr. James Chen', specialization: 'Endocrinologist', hospital: 'Metro Health', appointments: 8, emergencies: 0 },
      { id: 'd3', name: 'Dr. Emily Davis', specialization: 'General Physician', hospital: 'City General', appointments: 15, emergencies: 5 }
    ]));
  }

  if (!localStorage.getItem('medassist_appointments_global')) {
    localStorage.setItem('medassist_appointments_global', JSON.stringify([
      { id: 'a1', patientId: 'p1', patientName: 'John Doe', doctorId: 'd1', doctorName: 'Dr. Sarah Wilson', date: '2023-11-15', time: '10:00 AM', status: 'Confirmed' },
      { id: 'a2', patientId: 'p2', patientName: 'Alice Smith', doctorId: 'd2', doctorName: 'Dr. James Chen', date: '2023-11-16', time: '02:30 PM', status: 'Scheduled' },
      { id: 'a3', patientId: 'p4', patientName: 'Emma Brown', doctorId: 'd3', doctorName: 'Dr. Emily Davis', date: '2023-11-14', time: '11:00 AM', status: 'Completed' },
      { id: 'a4', patientId: 'p3', patientName: 'Michael Johnson', doctorId: 'd3', doctorName: 'Dr. Emily Davis', date: '2023-11-10', time: '09:00 AM', status: 'Missed' }
    ]));
  }

  if (!localStorage.getItem('medassist_alerts_global')) {
    localStorage.setItem('medassist_alerts_global', JSON.stringify([
      { id: 'al1', type: 'Emergency', patientName: 'Emma Brown', symptom: 'Severe chest pain', status: 'unread', time: '5 mins ago' },
      { id: 'al2', type: 'Missed Medicine', patientName: 'Alice Smith', symptom: 'Lisinopril 10mg', status: 'unread', time: '2 hours ago' },
      { id: 'al3', type: 'Emergency', patientName: 'John Doe', symptom: 'Fainted', status: 'Resolved', time: '1 day ago' }
    ]));
  }
};

// ── Helper: map backend snake_case to frontend camelCase ────────────
const mapPatient = (p) => ({
  id: p.id,
  name: p.name,
  age: p.age,
  gender: p.gender,
  phone: p.phone,
  condition: p.condition,
  caregiver: p.caregiver,
  adherence: p.adherence ?? 0,
  lastAlert: p.last_alert ?? p.lastAlert ?? null,
  status: p.status ?? 'Active',
});

const mapAppointment = (a) => ({
  id: a.id,
  patientId: a.patient_id ?? a.patientId,
  patientName: a.patient_name ?? a.patientName,
  doctorId: a.doctor_id ?? a.doctorId,
  doctorName: a.doctor_name ?? a.doctorName,
  date: a.date,
  time: a.time,
  status: a.status,
});

const mapAlert = (a) => ({
  id: a.id,
  type: a.type,
  patientName: a.patient_name ?? a.patientName,
  symptom: a.symptom,
  status: a.status,
  time: a.time,
});

// ── Data getters (API-first with localStorage fallback) ─────────────
export const getPatients = async () => {
  try {
    const data = await apiJson('/api/patients');
    return data.map(mapPatient);
  } catch {
    return JSON.parse(localStorage.getItem('medassist_patients') || '[]');
  }
};

export const getDoctors = async () => {
  try {
    return await apiJson('/api/doctors');
  } catch {
    return JSON.parse(localStorage.getItem('medassist_doctors') || '[]');
  }
};

export const getAppointments = async () => {
  try {
    const data = await apiJson('/api/appointments');
    return data.map(mapAppointment);
  } catch {
    return JSON.parse(localStorage.getItem('medassist_appointments_global') || '[]');
  }
};

export const getAlerts = async () => {
  try {
    const data = await apiJson('/api/alerts');
    return data.map(mapAlert);
  } catch {
    return JSON.parse(localStorage.getItem('medassist_alerts_global') || '[]');
  }
};

// ── Data mutators ───────────────────────────────────────────────────
export const updateAppointmentStatus = async (id, newStatus) => {
  try {
    await apiJson(`/api/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus }),
    });
  } catch {
    // Fallback to localStorage
    const apps = JSON.parse(localStorage.getItem('medassist_appointments_global') || '[]');
    const index = apps.findIndex(a => a.id === id);
    if (index !== -1) {
      apps[index].status = newStatus;
      localStorage.setItem('medassist_appointments_global', JSON.stringify(apps));
    }
  }
};

export const updateAlertStatus = async (id, newStatus) => {
  try {
    await apiJson(`/api/alerts/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus }),
    });
  } catch {
    // Fallback to localStorage
    const alerts = JSON.parse(localStorage.getItem('medassist_alerts_global') || '[]');
    const index = alerts.findIndex(a => a.id === id);
    if (index !== -1) {
      alerts[index].status = newStatus;
      localStorage.setItem('medassist_alerts_global', JSON.stringify(alerts));
    }
  }
};
