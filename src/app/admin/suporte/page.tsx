'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    Headphones,
    CheckCircle,
    Clock,
    AlertCircle,
    User,
    Mail,
    MessageSquare,
    CheckCircle2,
    XCircle
} from 'lucide-react';
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
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    async function fetchTickets() {
        setLoading(true);
        try {
            const snap = await getDocs(query(collection(db, 'supportTickets'), orderBy('createdAt', 'desc')));
            setTickets(snap.docs.map((d) => ({ id: d.id, ...d.data() } as SupportTicket)));
        } catch (error) {
            console.error('Error fetching tickets:', error);
            toast.error('Erro ao carregar chamados');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchTickets();
    }, []);

    async function closeTicket(id: string) {
        if (!confirm('Deseja marcar este chamado como resolvido?')) return;

        setActionLoading(id);
        try {
            await updateDoc(doc(db, 'supportTickets', id), {
                status: 'closed',
                updatedAt: new Date()
            });
            setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'closed' as const } : t)));
            toast.success('Chamado encerrado com sucesso');
        } catch (error) {
            toast.error('Erro ao fechar chamado');
        } finally {
            setActionLoading(null);
        }
    }

    const stats = useMemo(() => {
        return tickets.reduce((acc, ticket) => {
            acc.total++;
            if (ticket.status === 'open') acc.open++;
            else acc.closed++;
            return acc;
        }, { total: 0, open: 0, closed: 0 });
    }, [tickets]);

    return (
        <div className={styles.adminContainer}>
            <div className={styles.adminHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className={styles.kpiIcon} style={{ background: 'var(--brand-primary)', margin: 0 }}>
                        <Headphones size={20} />
                    </div>
                    <h1>Central de Suporte</h1>
                </div>
                <Button variant="secondary" onClick={fetchTickets} loading={loading}>Atualizar</Button>
            </div>

            <div className={styles.kpiGrid} style={{ marginBottom: 32 }}>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiLabel}>Total de Chamados</div>
                    <div className={styles.kpiValue}>{stats.total}</div>
                </div>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiLabel}>Abertos</div>
                    <div className={styles.kpiValue} style={{ color: 'var(--brand-primary)' }}>{stats.open}</div>
                </div>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiLabel}>Resolvidos</div>
                    <div className={styles.kpiValue} style={{ color: 'var(--text-tertiary)' }}>{stats.closed}</div>
                </div>
            </div>

            {loading ? (
                <div className="skeleton" style={{ height: 400, borderRadius: 20 }} />
            ) : tickets.length === 0 ? (
                <div className={styles.emptyAdmin} style={{ background: 'var(--bg-card)', borderRadius: 20, border: '1px solid var(--border-secondary)' }}>
                    <div className={styles.emptyIcon}>
                        <CheckCircle2 size={48} />
                    </div>
                    <h2>Tudo limpo por aqui!</h2>
                    <p>Não há chamados de suporte pendentes no momento.</p>
                </div>
            ) : (
                <div className={styles.tableWrapper} style={{ background: 'var(--bg-card)', borderRadius: 20, border: '1px solid var(--border-secondary)', overflow: 'hidden' }}>
                    <table className={styles.dataTable}>
                        <thead>
                            <tr>
                                <th>Usuário</th>
                                <th>Assunto</th>
                                <th>Mensagem</th>
                                <th>Data</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tickets.map((ticket) => (
                                <tr key={ticket.id}>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: 600, fontSize: '14px' }}>{ticket.userName || 'Usuário'}</span>
                                            <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>{ticket.userEmail}</span>
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: 600 }}>{ticket.subject}</td>
                                    <td style={{
                                        color: 'var(--text-secondary)',
                                        maxWidth: 250,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        fontSize: '13px'
                                    }} title={ticket.message}>
                                        {ticket.message}
                                    </td>
                                    <td style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>
                                        {ticket.createdAt?.toDate ? formatDate(ticket.createdAt.toDate()) : '-'}
                                    </td>
                                    <td>
                                        <span className={`${styles.statusPill} ${ticket.status === 'open' ? styles.statusProcessing : styles.statusOk}`}>
                                            {ticket.status === 'open' ? 'Aberto' : 'Resolvido'}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                            {ticket.status === 'open' && (
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    icon={<CheckCircle size={14} />}
                                                    onClick={() => closeTicket(ticket.id)}
                                                    loading={actionLoading === ticket.id}
                                                >
                                                    Resolver
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
