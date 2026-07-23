import { apiJson } from './apiClient';

/**
 * Data Service — connects frontend components to the backend REST API.
 * Real API integration only — zero mock data or localStorage fallbacks.
 */

// ── No-op seed function (kept to avoid breaking callers) ────────────
export const seedMockData = () => {
  // No-op: Mock data disabled. All data resides in Firestore / REST API.
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

// ── Data getters (REST API) ─────────────────────────────────────────
export const getPatients = async () => {
  try {
    const data = await apiJson('/api/patients');
    return Array.isArray(data) ? data.map(mapPatient) : [];
  } catch (err) {
    console.warn("Failed to fetch patients:", err.message);
    return [];
  }
};

export const getDoctors = async () => {
  try {
    const data = await apiJson('/api/doctors');
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn("Failed to fetch doctors:", err.message);
    return [];
  }
};

export const getAppointments = async () => {
  try {
    const data = await apiJson('/api/appointments');
    return Array.isArray(data) ? data.map(mapAppointment) : [];
  } catch (err) {
    console.warn("Failed to fetch appointments:", err.message);
    return [];
  }
};

export const getAlerts = async () => {
  try {
    const data = await apiJson('/api/alerts');
    return Array.isArray(data) ? data.map(mapAlert) : [];
  } catch (err) {
    console.warn("Failed to fetch alerts:", err.message);
    return [];
  }
};

// ── Data mutators ───────────────────────────────────────────────────
export const updateAppointmentStatus = async (id, newStatus) => {
  try {
    await apiJson(`/api/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus }),
    });
  } catch (err) {
    console.error("Failed to update appointment status:", err.message);
  }
};

export const updateAlertStatus = async (id, newStatus) => {
  try {
    await apiJson(`/api/alerts/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus }),
    });
  } catch (err) {
    console.error("Failed to update alert status:", err.message);
  }
};
