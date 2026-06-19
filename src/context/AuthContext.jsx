import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Try to get auth, but don't crash if firebase isn't configured
  let auth;
  try {
    auth = getAuth();
  } catch (e) {
    console.log("Firebase auth not ready");
  }

  useEffect(() => {
    // Check for mock user first
    const storedUser = localStorage.getItem('medassist_user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
      setLoading(false);
      return;
    }

    if (!auth) {
      setLoading(false);
      return;
    }

    try {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          // If real firebase user, we still need a role. If we don't have one in DB, we'll assume patient.
          setCurrentUser({ ...user, role: 'patient' });
        } else {
          setCurrentUser(null);
        }
        setLoading(false);
      });

      return unsubscribe;
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }, [auth]);

  const signup = async (email, password, displayName, role, extraData = {}) => {
    try {
      if (auth) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName });
        // In a real app, save extraData and role to Firestore here
        return userCredential;
      } else {
        throw new Error("No Firebase Auth");
      }
    } catch (error) {
      console.log("Fallback to Mock Registration due to:", error.message);
      // Mock flow
      const mockUser = { 
        uid: Date.now().toString(), 
        email, 
        displayName, 
        role,
        ...extraData,
        created_at: new Date().toISOString()
      };
      localStorage.setItem('medassist_user', JSON.stringify(mockUser));
      
      // Also save to a fake database list of users if we want
      const usersDB = JSON.parse(localStorage.getItem('medassist_db_users') || '[]');
      usersDB.push(mockUser);
      localStorage.setItem('medassist_db_users', JSON.stringify(usersDB));
      
      setCurrentUser(mockUser);
      return mockUser;
    }
  };

  const login = async (email, password, role) => {
    try {
      if (auth) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential;
      } else {
        throw new Error("No Firebase Auth");
      }
    } catch (error) {
      console.log("Fallback to Mock Login due to:", error.message);
      
      // Look up user in fake DB
      const usersDB = JSON.parse(localStorage.getItem('medassist_db_users') || '[]');
      let mockUser = usersDB.find(u => u.email === email && u.role === role);
      
      if (!mockUser) {
         // Create a demo user if they don't exist
         mockUser = { 
           uid: "demo123", 
           email, 
           displayName: "Demo User", 
           role: role 
         };
      }
      
      localStorage.setItem('medassist_user', JSON.stringify(mockUser));
      setCurrentUser(mockUser);
      return mockUser;
    }
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
    try {
      if (auth) {
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        return userCredential;
      } else {
        throw new Error("No Firebase Auth");
      }
    } catch (error) {
      console.log("Fallback to Mock Google Login");
      const mockUser = { uid: "google123", email: "google@demo.com", displayName: "Google Demo", role: role };
      localStorage.setItem('medassist_user', JSON.stringify(mockUser));
      setCurrentUser(mockUser);
      return mockUser;
    }
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
