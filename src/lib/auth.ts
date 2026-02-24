// ===========================
// Auth Helpers — Client-side
// ===========================

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    updatePassword,
    onAuthStateChanged,
    type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from './firebase';

export async function signUp(email: string, password: string) {
    return createUserWithEmailAndPassword(auth, email, password);
}

export async function signIn(email: string, password: string) {
    return signInWithEmailAndPassword(auth, email, password);
}

export async function signOut() {
    return firebaseSignOut(auth);
}

export async function changePassword(newPassword: string) {
    if (!auth.currentUser) throw new Error('Usuário não autenticado');
    return updatePassword(auth.currentUser, newPassword);
}

export function onAuthChange(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
}

export function getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
}

export async function getIdToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) return null;
    return user.getIdToken();
}
