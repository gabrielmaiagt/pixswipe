'use client';

import { useState, useEffect } from 'react';
import {
    Users,
    Package,
    GraduationCap,
    DollarSign,
    TrendingUp,
    Webhook,
    AlertCircle,
} from 'lucide-react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatBRL, formatDate } from '@/lib/utils';
import type { WebhookLog } from '@/types';
import TestModePanel from '@/components/admin/TestModePanel';
import styles from './admin.module.css';

interface KPI {
    label: string;
    value: string;
    icon: React.ReactNode;
    color: string;
}

export default function AdminDashboard() {
    const [kpis, setKpis] = useState<KPI[]>([]);
    const [recentWebhooks, setRecentWebhooks] = useState<WebhookLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const usersSnap = await getDocs(collection(db, 'users'));
                const totalUsers = usersSnap.size;

                const activeSnap = await getDocs(
                    query(collection(db, 'users'), where('entitlementStatus', '==', 'active'))
                );
                const activeUsers = activeSnap.size;

                const offersSnap = await getDocs(collection(db, 'offers'));
                const totalOffers = offersSnap.size;

                const lessonsSnap = await getDocs(collection(db, 'lessons'));
                const totalLessons = lessonsSnap.size;

                const paymentsSnap = await getDocs(collection(db, 'payments'));
                let totalRevenue = 0;
                paymentsSnap.docs.forEach((d) => {
                    totalRevenue += d.data().amount || 0;
                });

                setKpis([
                    { label: 'Usuários', value: totalUsers.toString(), icon: <Users size={18} />, color: 'var(--brand-primary)' },
                    { label: 'Assinantes ativos', value: activeUsers.toString(), icon: <TrendingUp size={18} />, color: 'var(--brand-secondary)' },
                    { label: 'Ofertas', value: totalOffers.toString(), icon: <Package size={18} />, color: 'var(--accent-purple)' },
                    { label: 'Aulas', value: totalLessons.toString(), icon: <GraduationCap size={18} />, color: 'var(--accent-orange)' },
                    { label: 'Receita total', value: formatBRL(totalRevenue), icon: <DollarSign size={18} />, color: 'var(--brand-primary)' },
                ]);

                const whSnap = await getDocs(
                    query(collection(db, 'webhookLogs'), orderBy('receivedAt', 'desc'), limit(10))
                );
                setRecentWebhooks(
                    whSnap.docs.map((d) => ({ id: d.id, ...d.data() } as WebhookLog))
                );
            } catch (err) {
                console.error('Admin fetch error:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading) {
        return (
            <div>
                <div className={styles.adminHeader}><h1>Painel Admin</h1></div>
                <div className={styles.kpiGrid}>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="skeleton" style={{ height: 100, borderRadius: 12 }} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className={styles.adminHeader}><h1>Painel Admin</h1></div>

            <TestModePanel />

            <div className={styles.kpiGrid}>
                {kpis.map((kpi) => (
                    <div key={kpi.label} className={styles.kpiCard}>
                        <div className={styles.kpiIcon} style={{ background: kpi.color }}>{kpi.icon}</div>
                        <div className={styles.kpiValue}>{kpi.value}</div>
                        <div className={styles.kpiLabel}>{kpi.label}</div>
                    </div>
                ))}
            </div>

            <div className={styles.adminHeader}>
                <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 700 }}>
                    <Webhook size={18} /> Webhooks recentes
                </h2>
            </div>

            {recentWebhooks.length === 0 ? (
                <div className={styles.emptyAdmin}>
                    <AlertCircle size={40} />
                    <p>Nenhum webhook registrado</p>
                </div>
            ) : (
                <table className={styles.dataTable}>
                    <thead>
                        <tr>
                            <th>Evento</th>
                            <th>Status</th>
                            <th>Data</th>
                            <th>Erro</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentWebhooks.map((wh) => (
                            <tr key={wh.id}>
                                <td>{wh.event}</td>
                                <td>
                                    <span className={`${styles.statusPill} ${wh.status === 'ok' ? styles.statusOk : wh.status === 'failed' ? styles.statusFailed : styles.statusProcessing}`}>
                                        {wh.status}
                                    </span>
                                </td>
                                <td>{wh.receivedAt?.toDate ? formatDate(wh.receivedAt.toDate()) : '-'}</td>
                                <td style={{ color: 'var(--accent-orange)', fontSize: 'var(--font-xs)' }}>{wh.error || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
