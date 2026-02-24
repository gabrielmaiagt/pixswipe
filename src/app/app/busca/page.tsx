'use client';

import { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Search, Package, BookOpen, Clock } from 'lucide-react';
import {
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    startAt,
    endAt,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import OfferCard from '@/components/offers/OfferCard';
import type { Offer, Lesson } from '@/types';
import { debounce } from '@/lib/utils';
import styles from '@/app/app/busca/busca.module.css';

type SearchTab = 'offers' | 'lessons';

export default function BuscaPage() {
    const { userData } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<SearchTab>('offers');
    const [offers, setOffers] = useState<Offer[]>([]);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const performSearch = useCallback(
        async (term: string) => {
            if (!term.trim()) {
                setOffers([]);
                setLessons([]);
                setSearched(false);
                return;
            }
            setLoading(true);
            setSearched(true);

            try {
                // Search offers by title prefix
                const offerSnap = await getDocs(
                    query(
                        collection(db, 'offers'),
                        where('status', '==', 'published'),
                        orderBy('title'),
                        startAt(term),
                        endAt(term + '\uf8ff'),
                        limit(20)
                    )
                );
                setOffers(
                    offerSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Offer))
                );

                // Search lessons by title prefix
                const lessonSnap = await getDocs(
                    query(
                        collection(db, 'lessons'),
                        where('status', '==', 'published'),
                        orderBy('title'),
                        startAt(term),
                        endAt(term + '\uf8ff'),
                        limit(20)
                    )
                );
                setLessons(
                    lessonSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Lesson))
                );
            } catch (err) {
                console.error('Search error:', err);
            } finally {
                setLoading(false);
            }
        },
        []
    );

    const debouncedSearch = useMemo(
        () => debounce((term: string) => performSearch(term), 400),
        [performSearch]
    );

    function handleSearchChange(value: string) {
        setSearchTerm(value);
        debouncedSearch(value);
    }

    return (
        <div className={styles.searchPage}>
            <h1>Busca</h1>

            {/* Search bar */}
            <div className={styles.searchBar}>
                <div className={styles.searchWrap}>
                    <Search size={18} className={styles.searchIcon} />
                    <input
                        className={styles.searchInput}
                        placeholder="Buscar ofertas ou aulas..."
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        autoFocus
                    />
                </div>
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'offers' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('offers')}
                >
                    <Package size={14} /> Ofertas ({offers.length})
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'lessons' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('lessons')}
                >
                    <BookOpen size={14} /> Aulas ({lessons.length})
                </button>
            </div>

            {/* Results */}
            {loading ? (
                <div className={styles.resultsGrid}>
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="skeleton" style={{ height: 240, borderRadius: 12 }} />
                    ))}
                </div>
            ) : !searched ? (
                <div className={styles.emptySearch}>
                    <Search size={48} />
                    <h3>Comece a buscar</h3>
                    <p>Digite o nome de uma oferta ou aula para buscar.</p>
                </div>
            ) : activeTab === 'offers' ? (
                offers.length === 0 ? (
                    <div className={styles.emptySearch}>
                        <Package size={48} />
                        <h3>Nenhuma oferta encontrada</h3>
                        <p>Tente buscar por outro termo.</p>
                    </div>
                ) : (
                    <div className={styles.resultsGrid}>
                        {offers.map((offer) => (
                            <OfferCard
                                key={offer.id}
                                offer={offer}
                                userPlan={userData?.plan}
                            />
                        ))}
                    </div>
                )
            ) : lessons.length === 0 ? (
                <div className={styles.emptySearch}>
                    <BookOpen size={48} />
                    <h3>Nenhuma aula encontrada</h3>
                    <p>Tente buscar por outro termo.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {lessons.map((lesson) => (
                        <Link
                            key={lesson.id}
                            href={`/app/aulas/${lesson.moduleId}/${lesson.id}`}
                            className={styles.lessonResult}
                        >
                            <BookOpen size={20} style={{ color: 'var(--brand-primary)', flexShrink: 0, marginTop: 2 }} />
                            <div>
                                <div style={{ fontWeight: 600, marginBottom: 2 }}>{lesson.title}</div>
                                <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-tertiary)' }}>
                                    <Clock size={11} /> {Math.floor(lesson.duration / 60)}:{(lesson.duration % 60).toString().padStart(2, '0')}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
