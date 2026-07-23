import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onIdTokenChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { apiClient } from '../utils/apiClient';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('medassist_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        // Only keep if it's not a demo user
        if (parsed && parsed.uid && !parsed.uid.startsWith('demo')) {
          setCurrentUser(parsed);
        } else {
          localStorage.removeItem('medassist_user');
          localStorage.removeItem('token');
        }
      } catch (e) {
        localStorage.removeItem('medassist_user');
      }
    }

    if (!auth) {
      setLoading(false);
      return;
    }

    try {
      const unsubscribe = onIdTokenChanged(auth, async (user) => {
        if (user) {
          const role = localStorage.getItem('ma_role') || 'patient';
          const token = await user.getIdToken().catch(() => null);
          const userData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            role: role
          };
          localStorage.setItem('medassist_user', JSON.stringify(userData));
          if (token) localStorage.setItem('token', token);
          setCurrentUser(userData);
        } else {
          setCurrentUser(null);
          localStorage.removeItem('medassist_user');
          localStorage.removeItem('token');
        }
        setLoading(false);
      });

      return unsubscribe;
    } catch (e) {
      console.error("Auth state listener error:", e);
      setLoading(false);
    }
  }, []);

  // Listen for 401 Unauthorized events from apiClient
  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const syncUserToBackend = async (userData) => {
    try {
      await apiClient('/api/users', {
        method: 'POST',
        body: JSON.stringify({
          email: userData.email,
          display_name: userData.displayName || 'User',
          role: userData.role,
          phone: userData.phone || null
        })
      });
    } catch (err) {
      console.warn("Could not sync user profile to backend API:", err.message);
    }
  };

  const signup = async (email, password, displayName, role, extraData = {}) => {
    if (!auth) {
      throw new Error("Firebase Auth is not initialized. Check your Firebase API key in config.");
    }
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName });
    
    const token = await userCredential.user.getIdToken();
    const userData = {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: displayName,
      role: role,
      ...extraData
    };
    localStorage.setItem('medassist_user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    setCurrentUser(userData);
    
    await syncUserToBackend(userData);
    return userCredential;
  };

  const login = async (email, password, role) => {
    if (!auth) {
      throw new Error("Firebase Auth is not initialized. Check your Firebase API key in config.");
    }
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();
    const userData = {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: userCredential.user.displayName,
      role: role
    };
    localStorage.setItem('medassist_user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    setCurrentUser(userData);

    await syncUserToBackend(userData);
    return userCredential;
  };

  const logout = async () => {
    try {
      if (auth) {
        await signOut(auth);
      }
    } catch (error) {
      console.error(error);
    } finally {
      localStorage.removeItem('medassist_user');
      localStorage.removeItem('ma_role');
      localStorage.removeItem('ma_lastRoute');
      localStorage.removeItem('token');
      setCurrentUser(null);
    }
  };

  const loginWithGoogle = async (role) => {
    if (!auth) {
      throw new Error("Firebase Auth is not initialized. Check your Firebase API key in config.");
    }
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const token = await userCredential.user.getIdToken();
    const userData = {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: userCredential.user.displayName,
      role: role
    };
    localStorage.setItem('medassist_user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    setCurrentUser(userData);

    await syncUserToBackend(userData);
    return userCredential;
  };

  const value = {
    currentUser,
    login,
    signup,
    logout,
    loginWithGoogle
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
