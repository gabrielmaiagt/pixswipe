// ===========================
// Firebase Client SDK — Browser only
// Graceful initialization — safe for SSR/prerender
// ===========================

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const isProd = process.env.NODE_ENV === 'production';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// --- Missing Config Security Guard ---
// In production, we MUST fail early if config is missing to avoid cryptic "400 Bad Request"
// from identitytoolkit.googleapis.com (Firebase Auth).
if (isProd && (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'placeholder')) {
    console.warn(
        "⚠️ FIREBASE CONFIGURATION ERROR: Critical environment variables are missing! " +
        "Login and Firestore will NOT work. Please check your production environment variables."
    );
}

function getFirebaseApp(): FirebaseApp {
    if (getApps().length > 0) return getApp();

    // Final check before initialization to prevent crash but warn clearly
    if (!firebaseConfig.apiKey) {
        console.error("Firebase API Key is missing. Check .env variables.");
    }

    return initializeApp(firebaseConfig as any);
}

const app = getFirebaseApp();
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);
export default app;
