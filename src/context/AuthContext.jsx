import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Using auth imported from firebaseConfig

  useEffect(() => {
    // Check for mock user or stored user first
    const storedUser = localStorage.getItem('medassist_user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
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
          // Avoid clearing mock user if Firebase reports null
          const stored = localStorage.getItem('medassist_user');
          const isMock = stored && (JSON.parse(stored).uid?.toString().startsWith('demo') || !stored.includes('"uid"'));
          if (!isMock) {
            setCurrentUser(null);
            localStorage.removeItem('token');
          }
        }
        setLoading(false);
      });

      return unsubscribe;
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }, [auth]);

  // Listen for 401 Unauthorized events from apiClient
  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const signup = async (email, password, displayName, role, extraData = {}) => {
    try {
      if (auth) {
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
