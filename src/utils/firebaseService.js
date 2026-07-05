import { apiJson, apiClient } from './apiClient';

/**
 * Firebase Service — bridges the frontend to the backend REST API.
 *
 * Replaces the localStorage mock with real API calls.
 * Falls back to localStorage if the backend is unreachable.
 * Maintains the exact same interface (get, set, update, remove, onValue).
 *
 * IMPORTANT: Some paths (like users/{uid}/caregiver, users/{uid}/profile)
 * have no backend API and are stored entirely in localStorage.
 */

/**
 * Paths that should ONLY use localStorage (no backend endpoint exists).
 * These are "deep" user sub-resources that the backend doesn't support.
 */
const isLocalOnlyPath = (path) => {
  const segments = path.split('/').filter(k => k);
  // users/{uid}/caregiver, users/{uid}/profile, etc.
  if (segments[0] === 'users' && segments.length >= 3) return true;
  return false;
};

/**
 * Converts a Firebase-style path to a REST API endpoint + method hint.
 * Returns null for paths that should use localStorage only.
 */
const pathToEndpoint = (path, method = 'GET') => {
  const segments = path.split('/').filter(k => k);
  if (segments.length === 0) return null;
  if (isLocalOnlyPath(path)) return null;

  const entity = segments[0];

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

  const mapped = entityMap[entity] || entity;

  // ── medicines ──
  if (entity === 'medicines' && segments.length === 2) {
    // "medicines/{userId}" → list medicines for this patient
    return { url: `/api/${mapped}?patient_id=${segments[1]}`, isList: true };
  }
  if (entity === 'medicines' && segments.length === 3) {
    // "medicines/{userId}/{medId}" → specific medicine
    return { url: `/api/${mapped}/${segments[2]}`, isList: false };
  }

  // ── alerts ──
  if (entity === 'alerts' && segments.length === 2) {
    // "alerts/{userId}" → list all alerts
    return { url: `/api/${mapped}`, isList: true };
  }
  if (entity === 'alerts' && segments.length === 3) {
    if (method === 'GET') {
      // "alerts/{userId}/{alertId}" GET → specific alert
      return { url: `/api/${mapped}/${segments[2]}`, isList: false };
    } else {
      // "alerts/{userId}/{alertId}" SET/POST → create new alert
      return { url: `/api/${mapped}`, isList: false, isCreate: true };
    }
  }

  // ── emergencies → alerts ──
  if (entity === 'emergencies') {
    // "emergencies/{uid}/{id}" → create alert (POST)
    return { url: `/api/alerts`, isList: false, isCreate: true };
  }

  // ── users (only shallow) ──
  if (entity === 'users' && segments.length === 2) {
    // "users/{userId}" → get user
    return { url: `/api/${mapped}/${segments[1]}`, isList: false };
  }

  // ── appointments ──
  if (entity === 'appointments' && segments.length === 1) {
    return { url: `/api/${mapped}`, isList: true };
  }
  if (entity === 'appointments' && segments.length === 2) {
    return { url: `/api/${mapped}/${segments[1]}`, isList: false };
  }

  // ── Default ──
  const id = segments.length > 1 ? segments[1] : null;
  return { url: id ? `/api/${mapped}/${id}` : `/api/${mapped}`, isList: !id };
};

class FirebaseService {
  constructor() {
    this.listeners = {};
    // Keep localStorage as persistent store
    if (!localStorage.getItem('mock_firebase_db')) {
      localStorage.setItem('mock_firebase_db', JSON.stringify({
        medicines: {},
        appointments: {},
        emergencies: {},
        users: {},
        alerts: {}
      }));
    }
  }

  _getDb() {
    return JSON.parse(localStorage.getItem('mock_firebase_db') || '{}');
  }

  _saveDb(db) {
    localStorage.setItem('mock_firebase_db', JSON.stringify(db));
    this._triggerListeners();
  }

  _getPathKeys(path) {
    return path.split('/').filter(k => k);
  }

  _getLocalData(path) {
    const db = this._getDb();
    const keys = this._getPathKeys(path);
    let data = db;
    for (const key of keys) {
      if (!data) break;
      data = data[key];
    }
    return data || null;
  }

  _triggerListeners() {
    const db = this._getDb();
    Object.keys(this.listeners).forEach(path => {
      const keys = this._getPathKeys(path);
      let data = db;
      for (const key of keys) {
        if (!data) break;
        data = data[key];
      }
      this.listeners[path].forEach(cb => cb(data || null));
    });
  }

  generateId() {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  async get(path) {
    // For local-only paths, skip API entirely
    if (isLocalOnlyPath(path)) {
      return this._getLocalData(path);
    }

    const endpoint = pathToEndpoint(path, 'GET');
    if (endpoint) {
      try {
        const data = await apiJson(endpoint.url);

        // If this is a list response and we expect an object keyed by ID,
        // convert the array to an object (for onValue compatibility)
        if (endpoint.isList && Array.isArray(data)) {
          const obj = {};
          data.forEach(item => {
            if (item && item.id) {
              obj[item.id] = item;
            }
          });
          return Object.keys(obj).length > 0 ? obj : null;
        }

        return data;
      } catch {
        // Fallback to localStorage
      }
    }

    return this._getLocalData(path);
  }

  async set(path, value) {
    // Always write to localStorage for persistence
    const db = this._getDb();
    const keys = this._getPathKeys(path);
    let current = db;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    this._saveDb(db);

    // For local-only paths, we're done
    if (isLocalOnlyPath(path)) {
      return value;
    }

    // Also try to sync to backend
    const endpoint = pathToEndpoint(path, 'SET');
    if (endpoint) {
      try {
        await apiJson(endpoint.url, {
          method: 'POST',
          body: JSON.stringify(value),
        });
      } catch {
        // localStorage write already succeeded, so this is fine
      }
    }

    return value;
  }

  async update(path, updates) {
    // Always update localStorage
    const db = this._getDb();
    const keys = this._getPathKeys(path);
    let current = db;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    const targetKey = keys[keys.length - 1];
    if (!current[targetKey] || typeof current[targetKey] !== 'object') {
      current[targetKey] = {};
    }
    current[targetKey] = { ...current[targetKey], ...updates };
    this._saveDb(db);

    // For local-only paths, we're done
    if (isLocalOnlyPath(path)) {
      return current[targetKey];
    }

    // Also try to sync to backend
    const endpoint = pathToEndpoint(path, 'PUT');
    if (endpoint) {
      try {
        await apiJson(endpoint.url, {
          method: 'PUT',
          body: JSON.stringify(updates),
        });
      } catch {
        // localStorage write already succeeded
      }
    }

    return current[targetKey];
  }

  async remove(path) {
    // Always remove from localStorage
    const db = this._getDb();
    const keys = this._getPathKeys(path);
    let current = db;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) return;
      current = current[keys[i]];
    }
    delete current[keys[keys.length - 1]];
    this._saveDb(db);

    // For local-only paths, we're done
    if (isLocalOnlyPath(path)) return;

    // Also try to sync to backend
    const endpoint = pathToEndpoint(path, 'DELETE');
    if (endpoint) {
      try {
        await apiClient(endpoint.url, { method: 'DELETE' });
      } catch {
        // localStorage delete already succeeded
      }
    }
  }

  onValue(path, callback) {
    if (!this.listeners[path]) {
      this.listeners[path] = [];
    }
    this.listeners[path].push(callback);

    // Initial trigger
    this.get(path).then(data => callback(data));

    // Return unsubscribe function
    return () => {
      this.listeners[path] = this.listeners[path].filter(cb => cb !== callback);
    };
  }
}

export const dbService = new FirebaseService();
