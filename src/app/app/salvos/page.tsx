'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Bookmark,
    Trash2,
    PackageOpen,
} from 'lucide-react';
import {
    collection,
    getDocs,
    doc,
    getDoc,
    deleteDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import OfferCard from '@/components/offers/OfferCard';
import type { Offer, SavedOffer } from '@/types';
import toast from 'react-hot-toast';

export default function SalvosPage() {
    const { firebaseUser, userData } = useAuth();
    const [offers, setOffers] = useState<Offer[]>([]);
    const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!firebaseUser) return;

        async function fetchSaved() {
            try {
                const savedSnap = await getDocs(
                    collection(db, 'users', firebaseUser!.uid, 'saves')
                );
                const ids = savedSnap.docs.map((d) => d.id);
                setSavedIds(new Set(ids));

                // Fetch offer details for each saved
                const offerPromises = ids.map(async (id) => {
                    const snap = await getDoc(doc(db, 'offers', id));
                    if (snap.exists()) return { id: snap.id, ...snap.data() } as Offer;
                    return null;
                });
                const results = await Promise.all(offerPromises);
                setOffers(results.filter(Boolean) as Offer[]);
            } catch (err) {
                console.error('Error fetching saved:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchSaved();
    }, [firebaseUser]);

    async function handleToggleSave(offerId: string) {
        if (!firebaseUser) return;
        const ref = doc(db, 'users', firebaseUser.uid, 'saves', offerId);

        if (savedIds.has(offerId)) {
            await deleteDoc(ref);
            setSavedIds((prev) => {
                const next = new Set(prev);
                next.delete(offerId);
                return next;
            });
            setOffers((prev) => prev.filter((o) => o.id !== offerId));
            toast.success('Removido dos salvos');
        }
    }

    if (loading) {
        return (
            <div>
                <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, marginBottom: 24 }}>Salvos</h1>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="skeleton" style={{ height: 260, borderRadius: 12 }} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div>
            <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, marginBottom: 24 }}>
                Salvos ({offers.length})
            </h1>

            {offers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-secondary)' }}>
                    <PackageOpen size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
                    <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, marginBottom: 8 }}>
                        Nenhuma oferta salva
                    </h3>
                    <p style={{ fontSize: 'var(--font-sm)' }}>
                        Salve ofertas para acessá-las rapidamente aqui.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                    {offers.map((offer) => (
                        <OfferCard
                            key={offer.id}
                            offer={offer}
                            userPlan={userData?.plan}
                            isSaved={true}
                            onToggleSave={handleToggleSave}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
