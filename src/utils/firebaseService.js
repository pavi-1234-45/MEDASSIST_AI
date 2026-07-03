import { apiJson } from './apiClient';

/**
 * Firebase Service — bridges the frontend to the backend REST API.
 *
 * Replaces the localStorage mock with real API calls.
 * Falls back to localStorage if the backend is unreachable.
 * Maintains the exact same interface (get, set, update, remove, onValue).
 */

// Entity path mapping: converts Firebase-style paths to REST endpoints
const pathToEndpoint = (path) => {
  const segments = path.split('/').filter(k => k);
  if (segments.length === 0) return null;

  const entity = segments[0];
  const id = segments.length > 1 ? segments[1] : null;

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
  return id ? `/api/${mapped}/${id}` : `/api/${mapped}`;
};

class FirebaseService {
  constructor() {
    this.listeners = {};
    // Keep localStorage as fallback store
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
    const endpoint = pathToEndpoint(path);
    if (endpoint) {
      try {
        return await apiJson(endpoint);
      } catch {
        // Fallback to localStorage
      }
    }

    const db = this._getDb();
    const keys = this._getPathKeys(path);
    let data = db;
    for (const key of keys) {
      if (!data) break;
      data = data[key];
    }
    return data || null;
  }

  async set(path, value) {
    const endpoint = pathToEndpoint(path);
    if (endpoint) {
      try {
        return await apiJson(endpoint, {
          method: 'POST',
          body: JSON.stringify(value),
        });
      } catch {
        // Fallback to localStorage
      }
    }

    const db = this._getDb();
    const keys = this._getPathKeys(path);
    let current = db;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
    this._saveDb(db);
    return value;
  }

  async update(path, updates) {
    const endpoint = pathToEndpoint(path);
    if (endpoint) {
      try {
        return await apiJson(endpoint, {
          method: 'PUT',
          body: JSON.stringify(updates),
        });
      } catch {
        // Fallback to localStorage
      }
    }

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
    return current[targetKey];
  }

  async remove(path) {
    const endpoint = pathToEndpoint(path);
    if (endpoint) {
      try {
        await apiJson(endpoint, { method: 'DELETE' });
        return;
      } catch {
        // Fallback to localStorage
      }
    }

    const db = this._getDb();
    const keys = this._getPathKeys(path);
    let current = db;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) return;
      current = current[keys[i]];
    }

    delete current[keys[keys.length - 1]];
    this._saveDb(db);
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
