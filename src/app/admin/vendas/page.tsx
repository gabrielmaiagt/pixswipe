'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    ShoppingBag,
    Search,
    RefreshCw,
    Mail,
    XCircle,
    CheckCircle2,
    AlertCircle,
} from 'lucide-react';
import {
    collection,
    getDocs,
    query,
    orderBy,
    limit,
    where,
    Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatBRL, formatDate } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import styles from '../admin.module.css';

interface Sale {
    id: string;
    uid: string | null;
    caktoSaleId: string;
    amount: number;
    plan: string;
    status: string;
    createdAt: Timestamp;
}

export default function AdminSalesPage() {
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    async function fetchSales() {
        setLoading(true);
        try {
            const q = query(collection(db, 'payments'), orderBy('createdAt', 'desc'), limit(500));
            const snap = await getDocs(q);
            setSales(snap.docs.map(d => ({ id: d.id, ...d.data() } as Sale)));
        } catch (error) {
            console.error('Error fetching sales:', error);
            toast.error('Erro ao carregar vendas');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchSales();
    }, []);

    const handleRefund = async (saleId: string) => {
        if (!confirm('Tem certeza que deseja estornar esta venda? O acesso do usuário será revogado.')) return;

        setActionLoading(saleId + '-refund');
        try {
            // In a real scenario, we would call our API route that uses caktoClient.refundOrder
            const response = await fetch('/api/admin/orders/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'refund', orderId: saleId }),
            });

            if (response.ok) {
                toast.success('Solicitação de estorno enviada com sucesso');
                fetchSales();
            } else {
                const err = await response.json();
                toast.error(`Erro: ${err.error || 'Falha ao estornar'}`);
            }
        } catch (error) {
            toast.error('Erro ao processar estorno');
        } finally {
            setActionLoading(null);
        }
    };

    const handleResendAccess = async (saleId: string) => {
        setActionLoading(saleId + '-resend');
        try {
            const response = await fetch('/api/admin/orders/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'resend', orderId: saleId }),
            });

            if (response.ok) {
                toast.success('Acesso reenviado com sucesso');
            } else {
                const err = await response.json();
                toast.error(`Erro: ${err.error || 'Falha ao reenviar'}`);
            }
        } catch (error) {
            toast.error('Erro ao reenviar acesso');
        } finally {
            setActionLoading(null);
        }
    };

    const filteredSales = sales.filter(s =>
        s.caktoSaleId.toLowerCase().includes(search.toLowerCase()) ||
        s.plan.toLowerCase().includes(search.toLowerCase())
    );

    const stats = useMemo(() => {
        return filteredSales.reduce((acc, sale) => {
            if (sale.status === 'approved') {
                acc.approvedCount++;
                acc.totalRevenue += sale.amount;
            } else if (sale.status === 'refunded') {
                acc.refundRefCount++;
            }
            return acc;
        }, { approvedCount: 0, totalRevenue: 0, refundRefCount: 0 });
    }, [filteredSales]);

    return (
        <div className={styles.adminContainer}>
            <div className={styles.adminHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className={styles.kpiIcon} style={{ background: 'var(--brand-primary)', margin: 0 }}>
                        <ShoppingBag size={20} />
                    </div>
                    <h1>Vendas</h1>
                </div>

                <div className={styles.headerActions} style={{ gap: 16 }}>
                    <div className={styles.searchBar} style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-secondary)',
                        borderRadius: '14px',
                        padding: '8px 16px',
                        width: '300px',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12
                    }}>
                        <Search size={18} style={{ color: 'var(--text-tertiary)' }} />
                        <input
                            type="text"
                            placeholder="Buscar por ID ou plano..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-primary)',
                                outline: 'none',
                                width: '100%',
                                fontSize: 'var(--font-sm)',
                                fontWeight: 500
                            }}
                        />
                    </div>
                    <button className={styles.btnSecondary} onClick={fetchSales}>
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Atualizar
                    </button>
                </div>
            </div>

            <div className={styles.kpiGrid} style={{ marginBottom: 32 }}>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiLabel}>Total de Vendas</div>
                    <div className={styles.kpiValue}>{filteredSales.length}</div>
                    <div className={styles.kpiSubLabel}>Últimas 500 transações</div>
                </div>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiLabel}>Aprovadas</div>
                    <div className={styles.kpiValue} style={{ color: 'var(--brand-primary)' }}>{stats.approvedCount}</div>
                </div>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiLabel}>Estornadas</div>
                    <div className={styles.kpiValue} style={{ color: 'var(--accent-orange)' }}>{stats.refundRefCount}</div>
                </div>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiLabel}>Faturamento</div>
                    <div className={styles.kpiValue}>{formatBRL(stats.totalRevenue)}</div>
                </div>
            </div>

            {loading ? (
                <div className="skeleton" style={{ height: 400, borderRadius: 20 }} />
            ) : filteredSales.length === 0 ? (
                <div className={styles.emptyAdmin} style={{ background: 'var(--bg-card)', borderRadius: 20, border: '1px solid var(--border-secondary)' }}>
                    <div className={styles.emptyIcon}>
                        <ShoppingBag size={48} />
                    </div>
                    <h2>Nenhuma venda encontrada</h2>
                    <p>Tente ajustar seus filtros de busca ou atualize a página.</p>
                </div>
            ) : (
                <div className={styles.tableWrapper} style={{ background: 'var(--bg-card)', borderRadius: 20, border: '1px solid var(--border-secondary)', overflow: 'hidden' }}>
                    <table className={styles.dataTable}>
                        <thead>
                            <tr>
                                <th>ID Cakto</th>
                                <th>Plano</th>
                                <th>Valor</th>
                                <th>Data</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSales.map((sale) => (
                                <tr key={sale.id}>
                                    <td style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                                        {sale.caktoSaleId}
                                    </td>
                                    <td>
                                        <span style={{ fontWeight: 700, fontSize: '12px' }}>{sale.plan.toUpperCase()}</span>
                                    </td>
                                    <td>
                                        <span style={{ fontWeight: 600 }}>{formatBRL(sale.amount)}</span>
                                    </td>
                                    <td style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>
                                        {formatDate(sale.createdAt.toDate())}
                                    </td>
                                    <td>
                                        <span className={`${styles.statusPill} ${sale.status === 'approved' ? styles.statusOk :
                                            sale.status === 'refunded' ? styles.statusFailed :
                                                styles.statusProcessing
                                            }`}>
                                            {sale.status === 'approved' ? 'Aprovado' :
                                                sale.status === 'refunded' ? 'Estornado' : sale.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                            <button
                                                className={styles.editBtn}
                                                style={{ padding: '8px' }}
                                                title="Reenviar Acesso"
                                                onClick={() => handleResendAccess(sale.caktoSaleId)}
                                                disabled={actionLoading === sale.caktoSaleId + '-resend'}
                                            >
                                                <Mail size={16} />
                                            </button>
                                            <button
                                                className={styles.deleteBtn}
                                                style={{ padding: '8px', color: 'var(--accent-orange)' }}
                                                title="Estornar Venda"
                                                onClick={() => handleRefund(sale.caktoSaleId)}
                                                disabled={actionLoading === sale.caktoSaleId + '-refund'}
                                            >
                                                <XCircle size={16} />
                                            </button>
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
