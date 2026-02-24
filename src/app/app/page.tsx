'use client';

import { useAuth } from '@/hooks/useAuth';
import Onboarding from '@/components/auth/Onboarding';
import { Package, GraduationCap, Zap, ArrowRight, PlayCircle } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import styles from '@/app/app/dashboard.module.css';

export default function DashboardPage() {
    const { userData, loading } = useAuth();

    if (loading) {
        return (
            <div className={styles.loadingState}>
                <div className="skeleton" style={{ height: '40px', width: '300px', marginBottom: '32px' }} />
                <div className={styles.statsGrid}>
                    <div className="skeleton" style={{ height: '100px', borderRadius: '12px' }} />
                    <div className="skeleton" style={{ height: '100px', borderRadius: '12px' }} />
                </div>
                <div className="skeleton" style={{ height: '300px', borderRadius: '24px', marginTop: '40px' }} />
            </div>
        );
    }

    // Show onboarding if not completed
    if (userData && !userData.onboarding?.completed) {
        return <Onboarding uid={userData.uid} onComplete={() => window.location.reload()} />;
    }

    const firstName = userData?.name?.split(' ')[0] || 'Membro';

    return (
        <div className={styles.dashboard}>
            <header className={styles.dashboardHeader}>
                <h1>Olá, {firstName} 👋</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Que bom ter você de volta. O que vamos rodar hoje?</p>
            </header>

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} bg-brand-primary-light`}>
                        <Package size={24} color="var(--brand-primary)" />
                    </div>
                    <div className={styles.statInfo}>
                        <h3>{userData?.metrics?.offersViewed || 0}</h3>
                        <p>Ofertas Visualizadas</p>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} bg-brand-secondary-light`}>
                        <GraduationCap size={24} color="var(--brand-secondary)" />
                    </div>
                    <div className={styles.statInfo}>
                        <h3>{userData?.metrics?.lessonsDone || 0}</h3>
                        <p>Aulas Concluídas</p>
                    </div>
                </div>
            </div>

            <div className={styles.welcomeBanner}>
                <div className={styles.welcomeContent}>
                    <h2>Sua primeira venda está a um clique</h2>
                    <p>Acesse nossa biblioteca de ofertas validadas e escale seu faturamento no X1 com criativos e funis prontos.</p>
                    <Link href="/app/ofertas">
                        <Button icon={<Zap size={18} />}>Ver Ofertas Agora</Button>
                    </Link>
                </div>
            </div>

            <div className={styles.dashboardActions}>
                <Link href="/app/ofertas" className={styles.actionCard}>
                    <div className={styles.actionIcon}><Package size={20} /></div>
                    <div className={styles.actionInfo}>
                        <h3>Explorar Ofertas</h3>
                        <p>As melhores ofertas X1 do mercado brasileiro.</p>
                    </div>
                    <ArrowRight size={16} className="mt-auto self-end text-muted" />
                </Link>

                <Link href="/app/aulas" className={styles.actionCard}>
                    <div className={styles.actionIcon}><PlayCircle size={20} /></div>
                    <div className={styles.actionInfo}>
                        <h3>Treinamentos</h3>
                        <p>Aprenda a implementar e escalar as ofertas.</p>
                    </div>
                    <ArrowRight size={16} className="mt-auto self-end text-muted" />
                </Link>
            </div>
        </div>
    );
}
