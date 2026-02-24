'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    TrendingUp,
    Wallet,
    DollarSign,
    BarChart3,
    MessageSquare,
    Target,
    ShoppingBag,
    Plus,
    Calendar,
    Save,
    Trash2,
    X,
    Loader2,
    History,
    ChevronDown,
    Edit3
} from 'lucide-react';
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    writeBatch,
    doc,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { Input, Select } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import type { FinancialEntry, TrackingItem } from '@/types';
import styles from './FinancialDashboard.module.css';

interface FinancialDashboardProps {
    isAdminView?: boolean;
}

type FilterType = 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'total';

export default function FinancialDashboard({ isAdminView }: FinancialDashboardProps) {
    const { userData: user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [trackingItems, setTrackingItems] = useState<TrackingItem[]>([]);
    const [entries, setEntries] = useState<FinancialEntry[]>([]);
    const [selectedTrackId, setSelectedTrackId] = useState<string>('');
    const [filter, setFilter] = useState<FilterType>('month');

    // Form State
    const [showNewTrackModal, setShowNewTrackModal] = useState(false);
    const [newTrackTitle, setNewTrackTitle] = useState('');
    const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
    const [formData, setFormData] = useState({
        adSpend: '',
        revenue: '',
        leads: '',
        salesCount: ''
    });
    const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

    // Fetch Tracking Items
    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'trackingItems'),
            where('userId', '==', isAdminView ? 'global' : user.uid),
            orderBy('createdAt', 'desc')
        );

        return onSnapshot(q, (snap) => {
            const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as TrackingItem));
            setTrackingItems(items);
            if (items.length > 0 && !selectedTrackId) {
                setSelectedTrackId(items[0].id);
            }
            setLoading(false);
        });
    }, [user, isAdminView]);

    // Fetch Entries for selected Tracking Item
    useEffect(() => {
        if (!selectedTrackId) {
            setEntries([]);
            return;
        }

        const q = query(
            collection(db, 'financialEntries'),
            where('trackingItemId', '==', selectedTrackId),
            orderBy('date', 'asc')
        );

        return onSnapshot(q, (snap) => {
            setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() } as FinancialEntry)));
        });
    }, [selectedTrackId]);

    // Calculations based on filter
    const filteredEntries = useMemo(() => {
        if (!entries.length) return [];

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        return entries.filter(entry => {
            const entryDate = entry.date.toDate();
            const entryDay = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate());

            switch (filter) {
                case 'today':
                    return entryDay.getTime() === today.getTime();
                case 'yesterday': {
                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);
                    return entryDay.getTime() === yesterday.getTime();
                }
                case 'week': {
                    const weekAgo = new Date(today);
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return entryDate >= weekAgo;
                }
                case 'month': {
                    const monthAgo = new Date(today);
                    monthAgo.setMonth(monthAgo.getMonth() - 1);
                    return entryDate >= monthAgo;
                }
                case 'year': {
                    const yearAgo = new Date(today);
                    yearAgo.setFullYear(yearAgo.getFullYear() - 1);
                    return entryDate >= yearAgo;
                }
                case 'total':
                    return true;
                default:
                    return true;
            }
        });
    }, [entries, filter]);

    const totals = useMemo(() => {
        return filteredEntries.reduce((acc, curr) => ({
            spend: acc.spend + (curr.adSpend || 0),
            rev: acc.rev + (curr.revenue || 0),
            leads: acc.leads + (curr.leads || 0),
            sales: acc.sales + (curr.salesCount || 0)
        }), { spend: 0, rev: 0, leads: 0, sales: 0 });
    }, [filteredEntries]);

    const metrics = useMemo(() => {
        const profit = totals.rev - totals.spend;
        const roas = totals.spend > 0 ? totals.rev / totals.spend : 0;
        const cpl = totals.leads > 0 ? totals.spend / totals.leads : 0;
        const cpa = totals.sales > 0 ? totals.spend / totals.sales : 0;

        return { profit, roas, cpl, cpa };
    }, [totals]);

    const [showEditTrackModal, setShowEditTrackModal] = useState(false);
    const [editTrackTitle, setEditTrackTitle] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    // Handlers
    const handleAddTracking = async () => {
        if (!newTrackTitle) return;
        try {
            await addDoc(collection(db, 'trackingItems'), {
                userId: isAdminView ? 'global' : user?.uid,
                title: newTrackTitle,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            setNewTrackTitle('');
            setShowNewTrackModal(false);
            toast.success('Oferta adicionada!');
        } catch (e) {
            toast.error('Erro ao adicionar');
        }
    };

    const handleUpdateTracking = async () => {
        if (!selectedTrackId || !editTrackTitle) return;
        try {
            await updateDoc(doc(db, 'trackingItems', selectedTrackId), {
                title: editTrackTitle,
                updatedAt: serverTimestamp()
            });
            setShowEditTrackModal(false);
            toast.success('Nome da oferta atualizado!');
        } catch (e) {
            toast.error('Erro ao atualizar nome');
        }
    };

    const handleDeleteTracking = async () => {
        if (!selectedTrackId) return;
        const item = trackingItems.find(t => t.id === selectedTrackId);
        if (!confirm(`TEM CERTEZA? Isso excluirá a oferta "${item?.title}" e TODOS os seus lançamentos permanentemente.`)) return;

        setIsDeleting(true);
        try {
            const batch = writeBatch(db);

            // 1. Delete all entries
            const entriesSnap = await getDocs(query(
                collection(db, 'financialEntries'),
                where('trackingItemId', '==', selectedTrackId)
            ));

            entriesSnap.forEach((d) => {
                batch.delete(doc(db, 'financialEntries', d.id));
            });

            // 2. Delete the item itself
            batch.delete(doc(db, 'trackingItems', selectedTrackId));

            await batch.commit();

            setSelectedTrackId('');
            toast.success('Oferta e lançamentos excluídos!');
        } catch (e) {
            console.error(e);
            toast.error('Erro ao excluir oferta');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSaveEntry = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTrackId) return;

        try {
            const data = {
                userId: user?.uid,
                trackingItemId: selectedTrackId,
                date: Timestamp.fromDate(new Date(entryDate + 'T12:00:00')),
                adSpend: parseFloat(formData.adSpend) || 0,
                revenue: parseFloat(formData.revenue) || 0,
                leads: parseInt(formData.leads) || 0,
                salesCount: parseInt(formData.salesCount) || 0,
                updatedAt: serverTimestamp()
            };

            if (editingEntryId) {
                await updateDoc(doc(db, 'financialEntries', editingEntryId), data);
                toast.success('Atualizado!');
                setEditingEntryId(null);
            } else {
                await addDoc(collection(db, 'financialEntries'), {
                    ...data,
                    createdAt: serverTimestamp()
                });
                toast.success('Salvo!');
            }
            setFormData({ adSpend: '', revenue: '', leads: '', salesCount: '' });
        } catch (e) {
            toast.error('Erro ao salvar');
        }
    };

    const handleEdit = (entry: FinancialEntry) => {
        setEditingEntryId(entry.id);
        setEntryDate(entry.date.toDate().toISOString().split('T')[0]);
        setFormData({
            adSpend: entry.adSpend.toString(),
            revenue: entry.revenue.toString(),
            leads: entry.leads.toString(),
            salesCount: entry.salesCount.toString()
        });
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Excluir este lançamento?')) return;
        try {
            await deleteDoc(doc(db, 'financialEntries', id));
            toast.success('Excluído');
        } catch (e) {
            toast.error('Erro ao excluir');
        }
    };

    if (loading) return <div>Carregando...</div>;

    const chartData = filteredEntries.map(e => ({
        date: new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(e.date.toDate()),
        faturamento: e.revenue,
        lucro: e.revenue - e.adSpend,
        gasto: e.adSpend
    }));

    return (
        <div className={styles.container}>
            {/* Header / Select Offer */}
            <div className={styles.topBar}>
                <div className={styles.selectGroup}>
                    <Select
                        label=""
                        value={selectedTrackId}
                        onChange={(e) => setSelectedTrackId(e.target.value)}
                        options={[
                            { value: '', label: 'Selecione uma oferta...' },
                            ...trackingItems.map(item => ({ value: item.id, label: item.title }))
                        ]}
                        style={{ width: 240 }}
                    />
                    {selectedTrackId && (
                        <div style={{ display: 'flex', gap: 6 }}>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                    const item = trackingItems.find(t => t.id === selectedTrackId);
                                    setEditTrackTitle(item?.title || '');
                                    setShowEditTrackModal(true);
                                }}
                                style={{ padding: '0 8px' }}
                            >
                                <Edit3 size={14} />
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={handleDeleteTracking}
                                loading={isDeleting}
                                style={{ padding: '0 8px', color: 'var(--accent-orange)' }}
                            >
                                <Trash2 size={14} />
                            </Button>
                        </div>
                    )}
                    <Button variant="secondary" onClick={() => setShowNewTrackModal(true)}>
                        <Plus size={16} /> Nova Oferta
                    </Button>
                </div>

                <div className={styles.filterBar}>
                    {(['today', 'yesterday', 'week', 'month', 'year', 'total'] as FilterType[]).map((f) => (
                        <button
                            key={f}
                            className={`${styles.filterBtn} ${filter === f ? styles.filterBtnActive : ''}`}
                            onClick={() => setFilter(f)}
                        >
                            {f === 'today' ? 'Hoje' : f === 'yesterday' ? 'Ontem' : f === 'week' ? 'Semana' : f === 'month' ? 'Mês' : f === 'year' ? 'Ano' : 'Total'}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI Cards */}
            <div className={styles.kpiGrid}>
                <KpiCard icon={<Wallet size={18} />} label="Gasto (Ads)" value={`R$ ${totals.spend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                <KpiCard icon={<TrendingUp size={18} />} label="Faturamento" value={`R$ ${totals.rev.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                <KpiCard icon={<DollarSign size={18} />} label="Lucro Total" value={`R$ ${metrics.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} color={metrics.profit >= 0 ? 'var(--brand-primary)' : 'var(--accent-orange)'} />
                <KpiCard icon={<BarChart3 size={18} />} label="ROAS" value={`${metrics.roas.toFixed(2)}x`} />
                <KpiCard icon={<MessageSquare size={18} />} label="Mensagens" value={totals.leads.toString()} />
                <KpiCard icon={<Target size={18} />} label="Custo/Lead" value={`R$ ${metrics.cpl.toFixed(2)}`} />
                <KpiCard icon={<ShoppingBag size={18} />} label="Vendas" value={totals.sales.toString()} />
            </div>

            <div className={styles.mainGrid}>
                {/* Daily Entry Form */}
                <div className={styles.entryCard}>
                    <div className={styles.sectionHeader}>
                        <Calendar size={18} />
                        <h3>{editingEntryId ? 'Editar Lançamento' : 'Lançamento Diário'}</h3>
                    </div>
                    <form onSubmit={handleSaveEntry}>
                        <Input
                            label="Data"
                            type="date"
                            value={entryDate}
                            onChange={(e) => setEntryDate(e.target.value)}
                            style={{ marginBottom: 16 }}
                            required
                        />
                        <div className={styles.formGrid}>
                            <Input
                                label="Gasto (Ads)"
                                type="number"
                                step="0.01"
                                placeholder="0,00"
                                value={formData.adSpend}
                                onChange={(e) => setFormData({ ...formData, adSpend: e.target.value })}
                                required
                            />
                            <Input
                                label="Retorno (Vendas)"
                                type="number"
                                step="0.01"
                                placeholder="0,00"
                                value={formData.revenue}
                                onChange={(e) => setFormData({ ...formData, revenue: e.target.value })}
                                required
                            />
                            <Input
                                label="Conversas (Leads)"
                                type="number"
                                placeholder="0"
                                value={formData.leads}
                                onChange={(e) => setFormData({ ...formData, leads: e.target.value })}
                                required
                            />
                            <Input
                                label="Vendas"
                                type="number"
                                placeholder="0"
                                value={formData.salesCount}
                                onChange={(e) => setFormData({ ...formData, salesCount: e.target.value })}
                                required
                            />
                        </div>
                        <div className={styles.formFooter}>
                            <Button type="submit" style={{ width: '100%' }}>
                                <Save size={16} /> {editingEntryId ? 'Atualizar Lançamento' : 'Salvar Lançamento'}
                            </Button>
                            {editingEntryId && (
                                <Button
                                    variant="secondary"
                                    style={{ width: '100%', marginTop: 8 }}
                                    onClick={() => {
                                        setEditingEntryId(null);
                                        setFormData({ adSpend: '', revenue: '', leads: '', salesCount: '' });
                                    }}
                                >
                                    Cancelar
                                </Button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Main Graph Area */}
                <div className={styles.chartSection}>
                    <div className={styles.sectionHeader}>
                        <TrendingUp size={18} />
                        <h3>Faturamento & Lucro</h3>
                    </div>
                    <div style={{ width: '100%', height: 350 }}>
                        <ResponsiveContainer>
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#00d4aa" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#00d4aa" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                <YAxis stroke="var(--text-tertiary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `R$ ${v}`} />
                                <Tooltip
                                    contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px' }}
                                    itemStyle={{ fontSize: '13px' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="faturamento"
                                    stroke="#8884d8"
                                    fillOpacity={1}
                                    fill="url(#colorFaturamento)"
                                    strokeWidth={3}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="lucro"
                                    stroke="#00d4aa"
                                    fillOpacity={1}
                                    fill="url(#colorLucro)"
                                    strokeWidth={3}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* History Table */}
            <div className={styles.historySection}>
                <div className={styles.sectionHeader}>
                    <History size={18} />
                    <h3>Histórico</h3>
                </div>
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Gasto</th>
                                <th>Retorno</th>
                                <th>Lucro</th>
                                <th>ROAS</th>
                                <th>Leads</th>
                                <th>CPL</th>
                                <th>Vendas</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...filteredEntries].sort((a, b) => b.date.toMillis() - a.date.toMillis()).map((entry) => {
                                const profit = entry.revenue - entry.adSpend;
                                const roas = entry.adSpend > 0 ? entry.revenue / entry.adSpend : 0;
                                const cpl = entry.leads > 0 ? entry.adSpend / entry.leads : 0;
                                return (
                                    <tr key={entry.id}>
                                        <td>{new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(entry.date.toDate())}</td>
                                        <td className={styles.valueNegative}>R$ {entry.adSpend.toFixed(2)}</td>
                                        <td className={styles.valuePositive}>R$ {entry.revenue.toFixed(2)}</td>
                                        <td className={profit >= 0 ? styles.valuePositive : styles.valueNegative}>R$ {profit.toFixed(2)}</td>
                                        <td>{roas.toFixed(2)}x</td>
                                        <td>{entry.leads}</td>
                                        <td>R$ {cpl.toFixed(2)}</td>
                                        <td>{entry.salesCount}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button onClick={() => handleEdit(entry)} style={{ color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}>
                                                    <Edit3 size={14} />
                                                </button>
                                                <button onClick={() => handleDelete(entry.id)} style={{ color: 'var(--accent-orange)', background: 'none', border: 'none', cursor: 'pointer' }}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* New Track Modal */}
            {showNewTrackModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h3>Nova Oferta para Trackear</h3>
                            <button onClick={() => setShowNewTrackModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <Input
                                label="Nome da Oferta"
                                value={newTrackTitle}
                                onChange={(e) => setNewTrackTitle(e.target.value)}
                                placeholder="Ex: Produto X - WhatsApp"
                                required
                            />
                            <div className={styles.actions} style={{ marginTop: 24 }}>
                                <Button variant="secondary" onClick={() => setShowNewTrackModal(false)}>Cancelar</Button>
                                <Button onClick={handleAddTracking}>Criar Oferta</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Track Modal */}
            {showEditTrackModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h3>Editar Nome da Oferta</h3>
                            <button onClick={() => setShowEditTrackModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <Input
                                label="Nome da Oferta"
                                value={editTrackTitle}
                                onChange={(e) => setEditTrackTitle(e.target.value)}
                                placeholder="Ex: Produto X - WhatsApp"
                                required
                            />
                            <div className={styles.actions} style={{ marginTop: 24 }}>
                                <Button variant="secondary" onClick={() => setShowEditTrackModal(false)}>Cancelar</Button>
                                <Button onClick={handleUpdateTracking}>Salvar Alterações</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function KpiCard({ icon, label, value, color }: { icon: any, label: string, value: string, color?: string }) {
    return (
        <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
                <div className={styles.kpiIcon}>{icon}</div>
                <span className={styles.kpiLabel}>{label}</span>
            </div>
            <div className={styles.kpiValue} style={{ color }}>{value}</div>
        </div>
    );
}
