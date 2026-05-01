'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import Onboarding from '@/components/auth/Onboarding';
import { Flame, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { PlanBadge } from '@/components/ui/Badge';
import OfferCard from '@/components/offers/OfferCard';
import type { Offer } from '@/types';
import styles from '@/app/app/dashboard.module.css';

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
}

function NicheTag({ niche }: { niche: string }) {
    return <span className={styles.nicheTag}>{niche}</span>;
}

export default function DashboardPage() {
    const { userData, loading } = useAuth();
    const [latestOffers, setLatestOffers] = useState<Offer[]>([]);
    const [offersLoading, setOffersLoading] = useState(true);

    useEffect(() => {
        async function fetchLatest() {
            try {
                const q = query(
                    collection(db, 'offers'),
                    where('status', '==', 'published'),
                    orderBy('createdAt', 'desc'),
                    limit(4)
                );
                const snap = await getDocs(q);
                setLatestOffers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Offer)));
            } catch (e) {
                console.error(e);
            } finally {
                setOffersLoading(false);
            }
        }
        fetchLatest();
    }, []);

    if (loading) {
        return (
            <div className={styles.dashboard}>
                <div className={styles.heroSkeleton}>
                    <div className="skeleton" style={{ height: '28px', width: '200px', marginBottom: '12px' }} />
                    <div className="skeleton" style={{ height: '48px', width: '360px', marginBottom: '16px' }} />
                    <div className="skeleton" style={{ height: '20px', width: '280px' }} />
                </div>
                <div className={styles.sectionHeader}>
                    <div className="skeleton" style={{ height: '22px', width: '160px' }} />
                </div>
                <div className={styles.offersGrid}>
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="skeleton" style={{ height: '110px', borderRadius: '14px' }} />
                    ))}
                </div>
            </div>
        );
    }

    if (userData && !userData.onboarding?.completed) {
        return <Onboarding uid={userData.uid} onComplete={() => window.location.reload()} />;
    }

    const firstName = userData?.name?.split(' ')[0] || 'Membro';
    const greeting = getGreeting();

    return (
        <div className={styles.dashboard}>

            {/* ── Hero ── */}
            <section className={styles.hero}>
                <div className={styles.heroGlow} />
                <div className={styles.heroContent}>
                    <p className={styles.heroGreeting}>{greeting}, {firstName} 👋</p>
                    <h1 className={styles.heroTitle}>Sua próxima oferta<br />vencedora está aqui.</h1>
                    <div className={styles.heroBadges}>
                        {userData?.plan && <PlanBadge plan={userData.plan} />}
                        <span className={styles.heroDivider}>•</span>
                        <span className={styles.heroDate}>
                            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </span>
                    </div>
                </div>
                <Link href="/app/ofertas" className={styles.heroCta}>
                    <Sparkles size={15} />
                    Ver todas as ofertas
                    <ArrowRight size={15} />
                </Link>
            </section>

            {/* ── Últimas ofertas ── */}
            <section>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>
                        <Flame size={18} color="var(--urgency-warm)" />
                        Recém-adicionadas
                    </h2>
                    <Link href="/app/ofertas" className={styles.sectionLink}>
                        Ver todas <ArrowRight size={14} />
                    </Link>
                </div>

                {offersLoading ? (
                    <div className={styles.offersGrid}>
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="skeleton" style={{ height: '280px', borderRadius: '12px' }} />
                        ))}
                    </div>
                ) : latestOffers.length === 0 ? (
                    <div className={styles.emptyOffers}>
                        <p>Nenhuma oferta publicada ainda.</p>
                    </div>
                ) : (
                    <div className={styles.offersGrid}>
                        {latestOffers.map(offer => (
                            <OfferCard key={offer.id} offer={offer} userPlan={userData?.plan} />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
