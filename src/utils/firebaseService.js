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
 * Replaces the mock localStorage database with real Firestore.
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

  /**
   * Reads data from Firestore or REST API.
   * If reading a collection (odd number of segments), returns an object keyed by ID
   * for backwards compatibility with onValue callers expecting { id1: item1, id2: item2 }.
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
      const endpoint = this._pathToRestEndpoint(path);
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

    // Sync to backend REST API
    try {
      const endpoint = this._pathToRestEndpoint(path);
      if (endpoint) {
        await apiJson(endpoint.url, {
          method: 'POST',
          body: JSON.stringify(value),
        });
      }
    } catch (e) {
      // Best-effort backend sync
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

    // Sync to backend REST API
    try {
      const endpoint = this._pathToRestEndpoint(path);
      if (endpoint) {
        await apiJson(endpoint.url, {
          method: 'PUT',
          body: JSON.stringify(updates),
        });
      }
    } catch (e) {
      // Best-effort backend sync
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

    // Sync to backend REST API
    try {
      const endpoint = this._pathToRestEndpoint(path);
      if (endpoint) {
        await apiClient(endpoint.url, { method: 'DELETE' });
      }
    } catch (e) {
      // Best-effort
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
            // Fallback to single fetch
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

    // Fallback: poll or fetch once via API
    this.get(path).then(data => callback(data));
    return () => {};
  }

  _pathToRestEndpoint(path) {
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

    const id = segments.length > 1 ? segments[segments.length - 1] : null;
    return { url: id ? `/api/${mapped}/${id}` : `/api/${mapped}` };
  }
}

export const dbService = new FirebaseService();
