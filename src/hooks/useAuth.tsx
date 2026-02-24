'use client';

import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from 'react';
import { type User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { onAuthChange } from '@/lib/auth';
import { db } from '@/lib/firebase';
import type { User } from '@/types';

interface AuthContextType {
    firebaseUser: FirebaseUser | null;
    userData: User | null;
    loading: boolean;
    isAdmin: boolean;
    isActive: boolean;
}

const AuthContext = createContext<AuthContextType>({
    firebaseUser: null,
    userData: null,
    loading: true,
    isAdmin: false,
    isActive: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [userData, setUserData] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubUser: (() => void) | null = null;

        const unsubAuth = onAuthChange(async (user) => {
            setFirebaseUser(user);

            if (unsubUser) {
                unsubUser();
                unsubUser = null;
            }

            if (!user) {
                setUserData(null);
                setLoading(false);
                return;
            }

            const token = await user.getIdToken();
            document.cookie = `__session=${token}; path=/; max-age=3600; SameSite=Lax`;

            const userRef = doc(db, 'users', user.uid);
            unsubUser = onSnapshot(userRef, (snapshot) => {
                if (snapshot.exists()) {
                    setUserData({ uid: snapshot.id, ...snapshot.data() } as User);
                } else {
                    setUserData(null);
                }
                setLoading(false);
            });
        });

        return () => {
            unsubAuth();
            if (unsubUser) unsubUser();
        };
    }, []);

    const isAdmin = userData?.role === 'admin';
    const isActive = userData?.entitlementStatus === 'active';

    return (
        <AuthContext.Provider value={{ firebaseUser, userData, loading, isAdmin, isActive }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    }
    return context;
}
