import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
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
