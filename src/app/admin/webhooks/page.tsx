'use client';

import { useState, useEffect } from 'react';
import { Webhook, RefreshCw, AlertCircle } from 'lucide-react';
import { collection, getDocs, doc, updateDoc, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Button from '@/components/ui/Button';
import { formatDateTime } from '@/lib/utils';
import type { WebhookLog } from '@/types';
import toast from 'react-hot-toast';
import styles from '../admin.module.css';

export default function AdminWebhooks() {
    const [logs, setLogs] = useState<WebhookLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetch() {
            const snap = await getDocs(query(collection(db, 'webhookLogs'), orderBy('receivedAt', 'desc'), limit(50)));
            setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() } as WebhookLog)));
            setLoading(false);
        }
        fetch();
    }, []);

    async function handleReprocess(id: string) {
        await updateDoc(doc(db, 'webhookLogs', id), { status: 'retried' });
        setLogs((prev) => prev.map((l) => (l.id === id ? { ...l, status: 'retried' as const } : l)));
        toast.success('Webhook marcado para reprocessar');
    }

    return (
        <div>
            <div className={styles.adminHeader}><h1>Webhook Logs</h1></div>

            {loading ? (
                <div className={styles.kpiGrid}>
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="skeleton" style={{ height: 60, borderRadius: 8 }} />
                    ))}
                </div>
            ) : logs.length === 0 ? (
                <div className={styles.emptyAdmin}>
                    <Webhook size={48} />
                    <p>Nenhum webhook registrado</p>
                </div>
            ) : (
                <table className={styles.dataTable}>
                    <thead>
                        <tr>
                            <th>Evento</th>
                            <th>Status</th>
                            <th>Recebido em</th>
                            <th>Processado em</th>
                            <th>Erro</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map((log) => (
                            <tr key={log.id}>
                                <td style={{ fontWeight: 600 }}>{log.event}</td>
                                <td>
                                    <span className={`${styles.statusPill} ${log.status === 'ok' ? styles.statusOk :
                                            log.status === 'failed' ? styles.statusFailed :
                                                styles.statusProcessing
                                        }`}>
                                        {log.status}
                                    </span>
                                </td>
                                <td>{log.receivedAt?.toDate ? formatDateTime(log.receivedAt.toDate()) : '-'}</td>
                                <td>{log.processedAt?.toDate ? formatDateTime(log.processedAt.toDate()) : '-'}</td>
                                <td style={{ color: 'var(--accent-orange)', fontSize: 'var(--font-xs)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {log.error || '-'}
                                </td>
                                <td>
                                    {log.status === 'failed' && (
                                        <Button size="sm" variant="secondary" icon={<RefreshCw size={12} />} onClick={() => handleReprocess(log.id)}>
                                            Reprocessar
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
