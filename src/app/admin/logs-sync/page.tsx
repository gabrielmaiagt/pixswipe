'use client';

import { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs, limit, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { History, Filter, ExternalLink, RefreshCw, BarChart2 } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import styles from '../admin.module.css';

interface SyncLog {
    id: string;
    offerId: string;
    offerTitle: string;
    adCount: number;
    creativesCount: number;
    debugRawItems: number;
    timestamp: any;
}

export default function SyncLogsPage() {
    const [logs, setLogs] = useState<SyncLog[]>([]);
    const [offers, setOffers] = useState<{ id: string, title: string }[]>([]);
    const [filterOfferId, setFilterOfferId] = useState('');
    const [loading, setLoading] = useState(true);

    async function fetchData() {
        setLoading(true);
        try {
            // Fetch offers for the filter
            const offersSnap = await getDocs(collection(db, 'offers'));
            setOffers(offersSnap.docs.map(doc => ({ id: doc.id, title: doc.data().title })));

            // Fetch logs
            let q;
            if (filterOfferId) {
                q = query(
                    collection(db, 'adminSyncLogs'),
                    where('offerId', '==', filterOfferId),
                    orderBy('timestamp', 'desc'),
                    limit(50)
                );
            } else {
                q = query(
                    collection(db, 'adminSyncLogs'),
                    orderBy('timestamp', 'desc'),
                    limit(50)
                );
            }

            const logsSnap = await getDocs(q);
            setLogs(logsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SyncLog)));
        } catch (err: any) {
            console.error('Fetch error:', err);
            // If it fails because of missing index, it will show in console
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
    }, [filterOfferId]);

    return (
        <div className={styles.adminPage}>
            <header className={styles.adminHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <History size={24} style={{ color: 'var(--brand-primary)' }} />
                    <h1>Logs de Sincronização</h1>
                </div>
                <Button onClick={fetchData} variant="secondary" icon={<RefreshCw size={16} />}>
                    Atualizar
                </Button>
            </header>

            {/* ── KPI Summary ── */}
            <div className={styles.kpiGrid} style={{ marginBottom: 32 }}>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiIcon} style={{ background: 'rgba(0, 212, 170, 0.12)', color: 'var(--brand-primary)' }}>
                        <RefreshCw size={20} />
                    </div>
                    <div className={styles.kpiValue}>{logs.length}</div>
                    <div className={styles.kpiLabel}>Últimos Logs</div>
                </div>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiIcon} style={{ background: 'rgba(0, 200, 255, 0.12)', color: 'var(--brand-secondary)' }}>
                        <BarChart2 size={20} />
                    </div>
                    <div className={styles.kpiValue}>
                        {logs.reduce((acc, curr) => acc + curr.adCount, 0)}
                    </div>
                    <div className={styles.kpiLabel}>Ads Encontrados</div>
                </div>
            </div>

            {/* ── Filter ── */}
            <div style={{ marginBottom: 24, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', width: '300px' }}>
                    <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>
                        <Filter size={16} />
                    </div>
                    <select
                        value={filterOfferId}
                        onChange={(e) => setFilterOfferId(e.target.value)}
                        style={{
                            width: '100%', padding: '10px 12px 10px 36px',
                            background: 'var(--bg-card)', border: '1px solid var(--border-secondary)',
                            borderRadius: 8, color: 'var(--text-primary)', fontSize: 14,
                            appearance: 'none', cursor: 'pointer'
                        }}
                    >
                        <option value="">Todas as ofertas</option>
                        {offers.map(o => (
                            <option key={o.id} value={o.id}>{o.title}</option>
                        ))}
                    </select>
                </div>
                {filterOfferId && (
                    <button
                        onClick={() => setFilterOfferId('')}
                        style={{ fontSize: 13, color: 'var(--brand-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                    >
                        Limpar filtro
                    </button>
                )}
            </div>

            {loading ? (
                <div className="skeleton" style={{ height: 400, borderRadius: 12 }} />
            ) : logs.length > 0 ? (
                <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border-secondary)', overflow: 'hidden' }}>
                    <table className={styles.dataTable}>
                        <thead>
                            <tr>
                                <th style={{ width: '30%' }}>Oferta</th>
                                <th style={{ textAlign: 'center' }}>Ads</th>
                                <th style={{ textAlign: 'center' }}>Criativos</th>
                                <th style={{ textAlign: 'center' }}>Itens Brutos</th>
                                <th style={{ textAlign: 'center' }}>Data/Hora</th>
                                <th style={{ textAlign: 'right' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log.id}>
                                    <td>
                                        <div style={{ fontWeight: 700, fontSize: 14 }}>{log.offerTitle}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{log.offerId}</div>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span style={{
                                            padding: '4px 8px', borderRadius: 6,
                                            background: 'rgba(0, 212, 170, 0.1)', color: 'var(--brand-primary)',
                                            fontWeight: 700, fontSize: 13
                                        }}>
                                            {log.adCount}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{log.creativesCount}</td>
                                    <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                                        {log.debugRawItems}
                                    </td>
                                    <td style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)' }}>
                                        {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString('pt-BR') : '—'}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <Link
                                            href={`/admin/ofertas/${log.offerId}`}
                                            className={styles.editBtn}
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
                                        >
                                            Ver Oferta <ExternalLink size={12} />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className={styles.emptyAdmin} style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px dashed var(--border-secondary)' }}>
                    <History size={48} />
                    <p>Nenhum log de sincronização encontrado.</p>
                </div>
            )}

            <style jsx>{`
                select {
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 12px center;
                    background-size: 16px;
                }
            `}</style>
        </div>
    );
}
