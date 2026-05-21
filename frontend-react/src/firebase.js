import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// VeriLearn Firebase App Configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDummyKey-For-VeriLearn-Academic-Ingestion",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "verilearn-academic.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "verilearn-academic",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "verilearn-academic.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "9988776655",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:9988776655:web:abcdef123456"
};

let app;
let auth;
let googleProvider;
let isFirebaseConfigured = false;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  isFirebaseConfigured = true;
} catch (error) {
  console.warn("Firebase failed to initialize. Using elegant simulated fallback auth system for local presentation support.", error);
}

export { auth, googleProvider, signInWithPopup, isFirebaseConfigured };
