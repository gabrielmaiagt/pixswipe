'use client';

import { useState, useEffect } from 'react';
import { DollarSign, Users as UsersIcon } from 'lucide-react';
import { collection, getDocs, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatBRL, formatDate } from '@/lib/utils';
import type { Affiliate } from '@/types';
import GradientChart from '@/components/admin/GradientChart';
import styles from '../admin.module.css';

export default function AdminAfiliados() {
    const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
    const [chartData, setChartData] = useState<{ name: string; value: number }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetch() {
            try {
                const snap = await getDocs(collection(db, 'affiliates'));
                setAffiliates(snap.docs.map((d) => ({ ...d.data() } as Affiliate)));

                // Fetch clicks for the last 30 days for the chart
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                // Assuming we have an 'affiliateClicks' collection or similar
                // If not, we can mock it for now to show the feature
                const clicksSnap = await getDocs(
                    query(
                        collection(db, 'affiliateClicks'),
                        where('timestamp', '>=', Timestamp.fromDate(thirtyDaysAgo)),
                        orderBy('timestamp', 'asc')
                    )
                );

                const dailyClicks: Record<string, number> = {};
                clicksSnap.docs.forEach(doc => {
                    const data = doc.data();
                    const date = data.timestamp.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                    dailyClicks[date] = (dailyClicks[date] || 0) + 1;
                });

                const formattedChartData = Object.entries(dailyClicks).map(([name, value]) => ({
                    name,
                    value
                }));

                setChartData(formattedChartData);
            } catch (err) {
                console.error('Affiliate fetch error:', err);
            } finally {
                setLoading(false);
            }
        }
        fetch();
    }, []);

    return (
        <div>
            <div className={styles.adminHeader}><h1>Afiliados</h1></div>

            {loading ? (
                <div className={styles.kpiGrid}>
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="skeleton" style={{ height: 60, borderRadius: 8 }} />
                    ))}
                </div>
            ) : affiliates.length === 0 ? (
                <div className={styles.emptyAdmin}>
                    <UsersIcon size={48} />
                    <p>Nenhum afiliado registrado</p>
                </div>
            ) : (
                <>
                    <div className={styles.adminHeader} style={{ marginTop: 24 }}>
                        <h2>Desempenho Geral (Cliques)</h2>
                    </div>
                    <div className={styles.adminCard} style={{ padding: '24px 16px', marginBottom: 32 }}>
                        <GradientChart data={chartData} color="var(--brand-secondary)" />
                    </div>

                    <table className={styles.dataTable}>
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Cliques</th>
                                <th>Vendas</th>
                                <th>Comissões</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {affiliates.map((aff) => (
                                <tr key={aff.affiliateCode}>
                                    <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{aff.affiliateCode}</td>
                                    <td>{aff.totalClicks}</td>
                                    <td>{aff.totalSales}</td>
                                    <td style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>{formatBRL(aff.totalEarnings)}</td>
                                    <td>
                                        <span className={`${styles.statusPill} ${aff.paymentStatus === 'paid' ? styles.statusOk : styles.statusProcessing}`}>
                                            {aff.paymentStatus === 'paid' ? 'Pago' : 'Pendente'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}
        </div>
    );
}
