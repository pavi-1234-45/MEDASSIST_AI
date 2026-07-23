import { db } from '../firebase/firebaseConfig';
import { 
  doc, 
  collection, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { apiJson, apiClient } from './apiClient';

/**
 * Firebase Service — Real-time Firestore SDK & REST API integration.
 *
 * Replaces the mock localStorage database with real Firestore & REST API.
 * Maintains the exact same interface (get, set, update, remove, onValue, generateId)
 * so NO component changes are required.
 */

class FirebaseService {
  generateId() {
    return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
  }

  _getPathSegments(path) {
    return path.split('/').filter(k => k);
  }

  _toSnakeCasePayload(entity, value) {
    if (!value || typeof value !== 'object') return value;
    const copy = { ...value };
    
    if (copy.patientId && !copy.patient_id) copy.patient_id = copy.patientId;
    if (copy.patientName && !copy.patient_name) copy.patient_name = copy.patientName;
    if (copy.doctorId && !copy.doctor_id) copy.doctor_id = copy.doctorId;
    if (copy.doctorName && !copy.doctor_name) copy.doctor_name = copy.doctorName;
    if (copy.displayName && !copy.display_name) copy.display_name = copy.displayName;
    if (copy.reminderTimes && !copy.reminder_times) copy.reminder_times = copy.reminderTimes;
    if (copy.caregiverId && !copy.caregiver_id) copy.caregiver_id = copy.caregiverId;

    // Ensure required schema fields are present
    if (entity === 'appointments') {
      if (!copy.patient_id) copy.patient_id = copy.patientId || 'patient_default';
      if (!copy.patient_name) copy.patient_name = copy.patientName || 'Patient';
      if (!copy.doctor_id) copy.doctor_id = copy.doctorId || 'doc_123';
      if (!copy.doctor_name) copy.doctor_name = copy.doctorName || 'Doctor';
      if (!copy.date) copy.date = new Date().toISOString().split('T')[0];
      if (!copy.time) copy.time = '10:00 AM';
    } else if (entity === 'medicines') {
      if (!copy.patient_id) copy.patient_id = copy.patientId || 'patient_default';
      if (!copy.dosage) copy.dosage = '1 Tablet';
      if (!copy.frequency) copy.frequency = 'Daily';
    } else if (entity === 'alerts' || entity === 'emergencies') {
      if (!copy.patient_name) copy.patient_name = copy.patientName || 'Patient';
      if (!copy.symptom) copy.symptom = copy.reason || copy.message || copy.type || 'Alert';
      if (!copy.type) copy.type = 'Emergency';
    }
    
    return copy;
  }

  /**
   * Reads data from Firestore or REST API.
   */
  async get(path) {
    const segments = this._getPathSegments(path);
    if (segments.length === 0) return null;

    if (db) {
      try {
        if (segments.length % 2 === 1) {
          // Collection path (e.g., 'appointments', 'medicines/uid', 'alerts/uid')
          const colRef = collection(db, ...segments);
          const snapshot = await getDocs(colRef);
          if (snapshot.empty) return null;
          const obj = {};
          snapshot.forEach(docSnap => {
            obj[docSnap.id] = { id: docSnap.id, ...docSnap.data() };
          });
          return obj;
        } else {
          // Document path (e.g., 'users/uid', 'appointments/appId')
          const docRef = doc(db, ...segments);
          const snap = await getDoc(docRef);
          return snap.exists() ? { id: snap.id, ...snap.data() } : null;
        }
      } catch (err) {
        console.warn(`Firestore get failed for ${path}:`, err.message);
      }
    }

    // Fallback to Backend REST API
    try {
      const endpoint = this._pathToRestEndpoint(path, 'GET');
      if (endpoint) {
        const data = await apiJson(endpoint.url);
        if (Array.isArray(data)) {
          const obj = {};
          data.forEach(item => {
            if (item && item.id) obj[item.id] = item;
          });
          return Object.keys(obj).length > 0 ? obj : null;
        }
        return data;
      }
    } catch (e) {
      console.warn(`REST fallback failed for ${path}:`, e.message);
    }

    return null;
  }

  /**
   * Creates or overwrites a document in Firestore & syncs to backend API if applicable.
   */
  async set(path, value) {
    const segments = this._getPathSegments(path);
    if (segments.length === 0) return value;

    if (db) {
      try {
        if (segments.length % 2 === 0) {
          // Document path (e.g., 'medicines/uid/medId')
          const docRef = doc(db, ...segments);
          await setDoc(docRef, value, { merge: true });
        } else {
          // Collection path (e.g., 'medicines/uid') -> generate doc ID
          const newDocRef = doc(collection(db, ...segments));
          await setDoc(newDocRef, value, { merge: true });
        }
      } catch (err) {
        console.warn(`Firestore set failed for ${path}:`, err.message);
      }
    }

    // Sync to backend REST API (POST to collection endpoint)
    try {
      const endpoint = this._pathToRestEndpoint(path, 'POST');
      if (endpoint) {
        const payload = this._toSnakeCasePayload(segments[0], value);
        await apiJson(endpoint.url, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
    } catch (e) {
      console.warn(`REST sync POST failed for ${path}:`, e.message);
    }

    return value;
  }

  /**
   * Updates fields of a document in Firestore.
   */
  async update(path, updates) {
    const segments = this._getPathSegments(path);
    if (segments.length === 0) return updates;

    if (db && segments.length % 2 === 0) {
      try {
        const docRef = doc(db, ...segments);
        await updateDoc(docRef, updates);
      } catch (err) {
        // If document doesn't exist yet, use setDoc with merge
        try {
          const docRef = doc(db, ...segments);
          await setDoc(docRef, updates, { merge: true });
        } catch (e) {
          console.warn(`Firestore update failed for ${path}:`, e.message);
        }
      }
    }

    // Sync to backend REST API (PUT to item endpoint)
    try {
      const endpoint = this._pathToRestEndpoint(path, 'PUT');
      if (endpoint) {
        const payload = this._toSnakeCasePayload(segments[0], updates);
        await apiJson(endpoint.url, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      }
    } catch (e) {
      console.warn(`REST sync PUT failed for ${path}:`, e.message);
    }

    return updates;
  }

  /**
   * Deletes a document from Firestore.
   */
  async remove(path) {
    const segments = this._getPathSegments(path);
    if (segments.length === 0) return;

    if (db && segments.length % 2 === 0) {
      try {
        const docRef = doc(db, ...segments);
        await deleteDoc(docRef);
      } catch (err) {
        console.warn(`Firestore delete failed for ${path}:`, err.message);
      }
    }

    // Sync to backend REST API (DELETE)
    try {
      const endpoint = this._pathToRestEndpoint(path, 'DELETE');
      if (endpoint) {
        await apiClient(endpoint.url, { method: 'DELETE' });
      }
    } catch (e) {
      console.warn(`REST sync DELETE failed for ${path}:`, e.message);
    }
  }

  /**
   * Real-time listener subscription via Firestore onSnapshot.
   */
  onValue(path, callback) {
    const segments = this._getPathSegments(path);
    if (segments.length === 0) {
      callback(null);
      return () => {};
    }

    if (db) {
      try {
        if (segments.length % 2 === 1) {
          // Collection listener
          const colRef = collection(db, ...segments);
          const unsubscribe = onSnapshot(colRef, (snapshot) => {
            if (snapshot.empty) {
              callback(null);
            } else {
              const obj = {};
              snapshot.forEach(docSnap => {
                obj[docSnap.id] = { id: docSnap.id, ...docSnap.data() };
              });
              callback(obj);
            }
          }, (error) => {
            console.warn(`onSnapshot collection error for ${path}:`, error.message);
            this.get(path).then(data => callback(data));
          });
          return unsubscribe;
        } else {
          // Document listener
          const docRef = doc(db, ...segments);
          const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
              callback({ id: docSnap.id, ...docSnap.data() });
            } else {
              callback(null);
            }
          }, (error) => {
            console.warn(`onSnapshot doc error for ${path}:`, error.message);
            this.get(path).then(data => callback(data));
          });
          return unsubscribe;
        }
      } catch (err) {
        console.warn(`Firestore onSnapshot setup failed for ${path}:`, err.message);
      }
    }

    // Fallback: fetch once via API
    this.get(path).then(data => callback(data));
    return () => {};
  }

  _pathToRestEndpoint(path, method = 'GET') {
    const segments = this._getPathSegments(path);
    if (segments.length === 0) return null;

    const entityMap = {
      medicines: 'medicines',
      appointments: 'appointments',
      emergencies: 'alerts',
      users: 'users',
      alerts: 'alerts',
      patients: 'patients',
      doctors: 'doctors',
      reports: 'reports',
    };

    const mapped = entityMap[segments[0]];
    if (!mapped) return null;

    // POST requests always target the collection endpoint e.g., /api/appointments
    if (method === 'POST') {
      return { url: `/api/${mapped}` };
    }

    const id = segments.length > 1 ? segments[segments.length - 1] : null;
    return { url: id ? `/api/${mapped}/${id}` : `/api/${mapped}` };
  }
}

export const dbService = new FirebaseService();
