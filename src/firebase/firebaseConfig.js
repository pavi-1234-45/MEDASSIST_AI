import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "medassist-ai-fc49b.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "medassist-ai-fc49b",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "medassist-ai-fc49b.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1002438576594",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1002438576594:web:c3dec7e7128ec01b22a00b",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-4T29VE790T"
};

let app;
let auth = null;

try {
  // Only initialize if config is somewhat valid (not the raw placeholders if possible, but here we'll try anyway)
  // Firebase will throw error if API key is invalid format.
  if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
  } else {
    console.warn("Firebase not configured properly. Using Mock Auth mode.");
  }
} catch (error) {
  console.warn("Firebase initialization failed. Using demo mode.", error);
}

export { auth };
