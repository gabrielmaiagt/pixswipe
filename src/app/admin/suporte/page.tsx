'use client';

import { useState, useEffect } from 'react';
import { Headphones, CheckCircle } from 'lucide-react';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Button from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';
import type { SupportTicket } from '@/types';
import toast from 'react-hot-toast';
import styles from '../admin.module.css';

export default function AdminSuporte() {
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetch() {
            const snap = await getDocs(query(collection(db, 'supportTickets'), orderBy('createdAt', 'desc')));
            setTickets(snap.docs.map((d) => ({ id: d.id, ...d.data() } as SupportTicket)));
            setLoading(false);
        }
        fetch();
    }, []);

    async function closeTicket(id: string) {
        await updateDoc(doc(db, 'supportTickets', id), { status: 'closed' });
        setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'closed' as const } : t)));
        toast.success('Ticket fechado');
    }

    return (
        <div>
            <div className={styles.adminHeader}><h1>Suporte</h1></div>

            {loading ? (
                <div className={styles.kpiGrid}>
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="skeleton" style={{ height: 60, borderRadius: 8 }} />
                    ))}
                </div>
            ) : tickets.length === 0 ? (
                <div className={styles.emptyAdmin}>
                    <Headphones size={48} />
                    <p>Nenhum ticket de suporte</p>
                </div>
            ) : (
                <table className={styles.dataTable}>
                    <thead>
                        <tr>
                            <th>Assunto</th>
                            <th>Mensagem</th>
                            <th>Status</th>
                            <th>Data</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tickets.map((ticket) => (
                            <tr key={ticket.id}>
                                <td style={{ fontWeight: 600 }}>{ticket.subject}</td>
                                <td style={{ color: 'var(--text-secondary)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {ticket.message}
                                </td>
                                <td>
                                    <span className={`${styles.statusPill} ${ticket.status === 'open' ? styles.statusProcessing : styles.statusOk}`}>
                                        {ticket.status === 'open' ? 'Aberto' : 'Fechado'}
                                    </span>
                                </td>
                                <td>{ticket.createdAt?.toDate ? formatDate(ticket.createdAt.toDate()) : '-'}</td>
                                <td>
                                    {ticket.status === 'open' && (
                                        <Button size="sm" variant="secondary" icon={<CheckCircle size={12} />} onClick={() => closeTicket(ticket.id)}>
                                            Fechar
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
