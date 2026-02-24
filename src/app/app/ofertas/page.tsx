'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    collection,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    getDocs,
    doc,
    setDoc,
    deleteDoc,
    type DocumentSnapshot,
    type QueryConstraint,
} from 'firebase/firestore';
import { Search, PackageOpen, Flame, Star } from 'lucide-react';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import OfferCard from '@/components/offers/OfferCard';
import Button from '@/components/ui/Button';
import type { Offer } from '@/types';
import { NICHE_OPTIONS } from '@/lib/utils';
import styles from './ofertas.module.css';

const PAGE_SIZE = 12;

export default function OfertasPage() {
    const { userData, firebaseUser } = useAuth();

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [nicheFilter, setNicheFilter] = useState('');
    const [featuredOnly, setFeaturedOnly] = useState(false);
    const [scalingOnly, setScalingOnly] = useState(false);

    // Data
    const [offers, setOffers] = useState<Offer[]>([]);
    const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
    const [hasMore, setHasMore] = useState(true);

    // Load saved offer IDs
    useEffect(() => {
        if (!firebaseUser) return;
        const fetchSaved = async () => {
            const snap = await getDocs(
                collection(db, 'users', firebaseUser.uid, 'saves')
            );
            const ids = new Set(snap.docs.map((d) => d.id));
            setSavedIds(ids);
        };
        fetchSaved();
    }, [firebaseUser]);

    // Build query
    const buildQuery = useCallback(
        (afterDoc?: DocumentSnapshot | null) => {
            const constraints: QueryConstraint[] = [
                where('status', '==', 'published'),
                orderBy('createdAt', 'desc'),
            ];

            if (nicheFilter) {
                constraints.splice(0, 0, where('niche', '==', nicheFilter));
            }
            if (featuredOnly) {
                constraints.splice(0, 0, where('featured', '==', true));
            }
            if (scalingOnly) {
                constraints.splice(0, 0, where('scalingBadge', '==', true));
            }
            if (afterDoc) {
                constraints.push(startAfter(afterDoc));
            }
            constraints.push(limit(PAGE_SIZE));

            return query(collection(db, 'offers'), ...constraints);
        },
        [nicheFilter, featuredOnly, scalingOnly]
    );

    // Fetch offers
    const fetchOffers = useCallback(
        async (reset = true) => {
            if (reset) {
                setLoading(true);
                setLastDoc(null);
            } else {
                setLoadingMore(true);
            }

            try {
                const q = buildQuery(reset ? null : lastDoc);
                const snap = await getDocs(q);
                const docs = snap.docs.map(
                    (d) => ({ id: d.id, ...d.data() } as Offer)
                );

                if (reset) {
                    setOffers(docs);
                } else {
                    setOffers((prev) => [...prev, ...docs]);
                }

                setLastDoc(snap.docs[snap.docs.length - 1] || null);
                setHasMore(snap.docs.length === PAGE_SIZE);
            } catch (err) {
                console.error('Error fetching offers:', err);
            } finally {
                setLoading(false);
                setLoadingMore(false);
            }
        },
        [buildQuery, lastDoc]
    );

    // Re-fetch when filters change
    useEffect(() => {
        fetchOffers(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nicheFilter, featuredOnly, scalingOnly]);

    // Client-side search filtering
    const filtered = useMemo(() => {
        if (!searchTerm.trim()) return offers;
        const q = searchTerm.toLowerCase();
        return offers.filter(
            (o) =>
                o.title.toLowerCase().includes(q) ||
                o.niche.toLowerCase().includes(q) ||
                o.tags?.some((t) => t.toLowerCase().includes(q))
        );
    }, [offers, searchTerm]);

    // Toggle save
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
        } else {
            await setDoc(ref, { offerId, savedAt: new Date() });
            setSavedIds((prev) => new Set(prev).add(offerId));
        }
    }

    // Clear filters
    function clearFilters() {
        setSearchTerm('');
        setNicheFilter('');
        setFeaturedOnly(false);
        setScalingOnly(false);
    }

    const hasActiveFilters = searchTerm || nicheFilter || featuredOnly || scalingOnly;

    return (
        <div className={styles.offersPage}>
            <h1>Ofertas</h1>

            {/* Filter bar */}
            <div className={styles.filterBar}>
                <div className={styles.searchWrap}>
                    <Search size={16} className={styles.searchIcon} />
                    <input
                        className={styles.searchInput}
                        placeholder="Buscar por nome ou nicho..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <select
                    className={styles.filterSelect}
                    value={nicheFilter}
                    onChange={(e) => setNicheFilter(e.target.value)}
                >
                    <option value="">Todos os nichos</option>
                    {NICHE_OPTIONS.map((n) => (
                        <option key={n} value={n}>
                            {n}
                        </option>
                    ))}
                </select>

                <button
                    className={`${styles.filterChip} ${featuredOnly ? styles.filterChipActive : ''}`}
                    onClick={() => setFeaturedOnly(!featuredOnly)}
                >
                    <Star size={12} /> Destaque
                </button>

                <button
                    className={`${styles.filterChip} ${scalingOnly ? styles.filterChipActive : ''}`}
                    onClick={() => setScalingOnly(!scalingOnly)}
                >
                    <Flame size={12} /> Escalando
                </button>

                {hasActiveFilters && (
                    <button className={styles.clearBtn} onClick={clearFilters}>
                        Limpar filtros
                    </button>
                )}
            </div>

            {/* Results info */}
            {!loading && (
                <p className={styles.resultsInfo}>
                    {filtered.length} oferta{filtered.length !== 1 ? 's' : ''} encontrada
                    {filtered.length !== 1 ? 's' : ''}
                </p>
            )}

            {/* Grid */}
            {loading ? (
                <div className={styles.offersGrid}>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className={styles.skeletonCard}>
                            <div className={styles.skeletonThumb} />
                            <div className={styles.skeletonBody}>
                                <div className={styles.skeletonLine} />
                                <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className={styles.emptyState}>
                    <PackageOpen size={48} />
                    <h3>Nenhuma oferta encontrada</h3>
                    <p>
                        {hasActiveFilters
                            ? 'Tente ajustar os filtros para ver mais resultados.'
                            : 'Novas ofertas serão publicadas em breve.'}
                    </p>
                </div>
            ) : (
                <>
                    <div className={styles.offersGrid}>
                        {filtered.map((offer) => (
                            <OfferCard
                                key={offer.id}
                                offer={offer}
                                userPlan={userData?.plan}
                                isSaved={savedIds.has(offer.id)}
                                onToggleSave={handleToggleSave}
                            />
                        ))}
                    </div>

                    {hasMore && !searchTerm && (
                        <div className={styles.loadMore}>
                            <Button
                                variant="secondary"
                                loading={loadingMore}
                                onClick={() => fetchOffers(false)}
                            >
                                Carregar mais ofertas
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
