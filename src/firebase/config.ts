import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// User's connected Firebase project
export const DEFAULT_FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: "AIzaSyBt8TVnQn_ploZGXf88vz5jVktQq2mmBvc",
  authDomain: "waste-management-2026-68fb6.firebaseapp.com",
  projectId: "waste-management-2026-68fb6",
  storageBucket: "waste-management-2026-68fb6.firebasestorage.app",
  messagingSenderId: "914126555405",
  appId: "1:914126555405:web:eb8b6fbbcb1cb42d0e8844"
};

const getInitialConfig = (): FirebaseConfig => {
  const saved = localStorage.getItem('ecoroute_firebase_config');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.apiKey && parsed.projectId) return parsed;
    } catch {
      // fallback
    }
  }

  // Use default provided project or environment variables
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || DEFAULT_FIREBASE_CONFIG.apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || DEFAULT_FIREBASE_CONFIG.authDomain,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_CONFIG.projectId,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || DEFAULT_FIREBASE_CONFIG.storageBucket,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
    appId: import.meta.env.VITE_FIREBASE_APP_ID || DEFAULT_FIREBASE_CONFIG.appId
  };
};

export const currentFirebaseConfig = getInitialConfig();

export const isFirebaseConfigured = (): boolean => {
  return Boolean(
    currentFirebaseConfig.apiKey &&
    currentFirebaseConfig.projectId &&
    !currentFirebaseConfig.apiKey.includes('YOUR_')
  );
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

try {
  if (isFirebaseConfigured()) {
    app = getApps().length === 0 ? initializeApp(currentFirebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    console.log(`[Firebase] Successfully connected to project: ${currentFirebaseConfig.projectId}`);
  }
} catch (error) {
  console.warn('[Firebase] Initialization error:', error);
}

export { app, auth, db };

export const saveFirebaseConfig = (config: FirebaseConfig) => {
  localStorage.setItem('ecoroute_firebase_config', JSON.stringify(config));
  window.location.reload();
};

export const clearFirebaseConfig = () => {
  localStorage.removeItem('ecoroute_firebase_config');
  window.location.reload();
};
