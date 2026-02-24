// ===========================
// Firebase Admin SDK — Server-side only
// Used in API routes and server components
// Lazy initialization to prevent build-time errors
// ===========================

import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getStorage, type Storage } from 'firebase-admin/storage';

let _app: App | null = null;
let _db: Firestore | null = null;
let _auth: Auth | null = null;
let _storage: Storage | null = null;

function getAdminApp(): App {
    if (_app) return _app;

    if (getApps().length > 0) {
        _app = getApps()[0];
        return _app;
    }

    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
        throw new Error(
            'Firebase Admin SDK credentials not configured. Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY.'
        );
    }

    _app = initializeApp({
        credential: cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });

    return _app;
}

// Lazy getters — only initialize when actually called at runtime
export function getAdminDb(): Firestore {
    if (!_db) _db = getFirestore(getAdminApp());
    return _db;
}

export function getAdminAuth(): Auth {
    if (!_auth) _auth = getAuth(getAdminApp());
    return _auth;
}

export function getAdminStorage(): Storage {
    if (!_storage) _storage = getStorage(getAdminApp());
    return _storage;
}

// Convenience aliases (lazy — safe for import at module level)
export const adminDb = new Proxy({} as Firestore, {
    get(_, prop) {
        return (getAdminDb() as any)[prop];
    },
});

export const adminAuth = new Proxy({} as Auth, {
    get(_, prop) {
        return (getAdminAuth() as any)[prop];
    },
});

export const adminStorage = new Proxy({} as Storage, {
    get(_, prop) {
        return (getAdminStorage() as any)[prop];
    },
});
