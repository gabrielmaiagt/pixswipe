'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc, collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import OfferForm from '@/components/admin/OfferForm';
import Button from '@/components/ui/Button';
import type { Offer, AdSnapshot } from '@/types';
import { RefreshCw, BarChart2, CheckCircle, XCircle, Loader2, History, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from '../../admin.module.css';

type SyncState = 'idle' | 'starting' | 'syncing' | 'running' | 'done' | 'failed';

export default function EditOfferPage() {
    const { id } = useParams();
    const [offer, setOffer] = useState<Offer | null>(null);
    const [snapshots, setSnapshots] = useState<AdSnapshot[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncState, setSyncState] = useState<SyncState>('idle');
    const [syncMsg, setSyncMsg] = useState('');
    const [syncRunId, setSyncRunId] = useState<string | null>(null);
    const [syncDatasetId, setSyncDatasetId] = useState<string | null>(null);
    const [elapsed, setElapsed] = useState(0);
    const [syncResult, setSyncResult] = useState<{ adCount: number; creativesFound: number } | null>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    async function loadSnapshots() {
        if (!id) return;
        const q = query(collection(db, 'offers', id as string, 'adSnapshots'), orderBy('scrapedAt', 'desc'));
        const snap = await getDocs(q);
        setSnapshots(snap.docs.map(d => ({ id: d.id, ...d.data() } as AdSnapshot)));
    }

    useEffect(() => {
        async function load() {
            if (!id) return;
            const snap = await getDoc(doc(db, 'offers', id as string));
            if (snap.exists()) setOffer({ id: snap.id, ...snap.data() } as Offer);
            await loadSnapshots();
            setLoading(false);
        }
        load();
    }, [id]);

    function startTimer() {
        setElapsed(0);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    }

    function stopTimer() {
        if (timerRef.current) clearInterval(timerRef.current);
    }

    function stopPoll() {
        if (pollRef.current) clearInterval(pollRef.current);
    }

    // Polling effect
    useEffect(() => {
        if (syncState !== 'running' && syncState !== 'syncing') {
            stopPoll();
            return;
        }

        if (!syncRunId || !syncDatasetId) return;

        pollRef.current = setInterval(async () => {
            try {
                const res = await fetch(
                    `/api/admin/sync-offer-ads/poll?runId=${syncRunId}&datasetId=${syncDatasetId}&offerId=${id}`
                );
                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || `Erro na verificação (${res.status})`);
                }

                if (data.status === 'RUNNING' || data.status === 'READY' || data.status === 'STARTING') {
                    setSyncState('running');
                    setSyncMsg('O scraper está rodando. Aguarde...');
                    return;
                }

                stopPoll();
                stopTimer();

                if (data.status === 'FINISHED' || data.status === 'SUCCEEDED') {
                    setSyncResult({ adCount: data.adCount, creativesFound: data.creativeCount });
                    setSyncMsg(`${data.adCount} anúncios encontrados · ${data.creativeCount} criativos`);
                    setSyncState('done');
                    await loadSnapshots();
                } else {
                    setSyncMsg(data.error || `Sync falhou: ${data.status}`);
                    setSyncState('failed');
                }
            } catch (err: any) {
                console.error('Polling error:', err);
                // Don't stop poll on transient errors unless it's a 400
            }
        }, 5000);

        return () => stopPoll();
    }, [syncState, syncRunId, syncDatasetId, id]);

    async function handleSync() {
        if (!id || !offer?.adLibraryUrl) {
            toast.error('Adicione uma URL da Biblioteca de Anúncios antes de sincronizar.');
            return;
        }

        setSyncState('starting');
        setSyncMsg('Conectando ao Apify...');
        setSyncResult(null);
        startTimer();

        try {
            const res = await fetch('/api/admin/sync-offer-ads/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ offerId: id }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Falha ao iniciar');

            if (data.success) {
                setSyncState('syncing');
                setSyncMsg('Aguardando conclusão do Apify...');
                setSyncRunId(data.runId);
                setSyncDatasetId(data.datasetId);
            } else {
                throw new Error(data.error || 'Falha desconhecida no início');
            }
        } catch (err: any) {
            stopTimer();
            setSyncState('failed');
            setSyncMsg(err.message || 'Ocorreu um erro ao iniciar a sincronização.');
        }
    }

    function closeModal() {
        stopPoll();
        stopTimer();
        setSyncState('idle');
    }

    if (loading) return <div className="skeleton" style={{ height: 400 }} />;
    if (!offer) return <div>Oferta não encontrada</div>;

    const isSyncing = syncState === 'starting' || syncState === 'syncing' || syncState === 'running';

    return (
        <div>
            {/* ── Sync progress modal ── */}
            {syncState !== 'idle' && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 1000,
                    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <div style={{
                        background: 'var(--bg-card)', border: '1px solid var(--border-secondary)',
                        borderRadius: 20, padding: '40px 48px', maxWidth: 420, width: '90%',
                        textAlign: 'center', boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
                    }}>
                        {/* Icon */}
                        <div style={{
                            width: 72, height: 72, borderRadius: '50%', margin: '0 auto 20px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: syncState === 'done'
                                ? 'rgba(0,212,170,0.12)'
                                : syncState === 'failed'
                                    ? 'rgba(255,100,100,0.12)'
                                    : 'rgba(0,212,170,0.08)',
                            border: `2px solid ${syncState === 'done' ? 'rgba(0,212,170,0.4)' : syncState === 'failed' ? 'rgba(255,100,100,0.4)' : 'rgba(0,212,170,0.2)'}`,
                        }}>
                            {isSyncing && <Loader2 size={32} style={{ color: 'var(--brand-primary)', animation: 'spin 1s linear infinite' }} />}
                            {syncState === 'done' && <CheckCircle size={32} style={{ color: '#00d4aa' }} />}
                            {syncState === 'failed' && <XCircle size={32} style={{ color: '#ff6b6b' }} />}
                        </div>

                        <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
                            {isSyncing ? 'Sincronizando...' : syncState === 'done' ? 'Sync concluído!' : 'Erro no sync'}
                        </h3>

                        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
                            {syncMsg}
                        </p>

                        {isSyncing && (
                            <div style={{ marginBottom: 20 }}>
                                {/* Progress bar (indeterminate) */}
                                <div style={{
                                    height: 4, background: 'var(--bg-elevated)',
                                    borderRadius: 4, overflow: 'hidden', marginBottom: 10,
                                }}>
                                    <div style={{
                                        height: '100%', width: '40%',
                                        background: 'var(--brand-primary)',
                                        borderRadius: 4,
                                        animation: 'slideProgress 1.5s ease-in-out infinite',
                                    }} />
                                </div>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                    {elapsed}s — o Apify pode levar até 2 minutos
                                </span>
                            </div>
                        )}

                        {syncState === 'done' && syncResult && (
                            <div style={{
                                display: 'flex', gap: 12, marginBottom: 20,
                            }}>
                                <div style={{
                                    flex: 1, background: 'var(--bg-tertiary)', borderRadius: 12,
                                    padding: '14px 12px', textAlign: 'center',
                                }}>
                                    <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--brand-primary)' }}>
                                        {syncResult.adCount}
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>anúncios</div>
                                </div>
                                <div style={{
                                    flex: 1, background: 'var(--bg-tertiary)', borderRadius: 12,
                                    padding: '14px 12px', textAlign: 'center',
                                }}>
                                    <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>
                                        {syncResult.creativesFound}
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>criativos</div>
                                </div>
                            </div>
                        )}

                        {!isSyncing && (
                            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                                <Button onClick={closeModal} variant="secondary">
                                    Fechar
                                </Button>
                                {syncState === 'failed' && (
                                    <Button onClick={handleSync} variant="primary">
                                        Tentar novamente
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Page header ── */}
            <div className={styles.adminHeader} style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
            }}>
                <h1>Editar Oferta: {offer.title}</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {offer.lastAdCount !== undefined && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                            <BarChart2 size={14} />
                            <span>
                                <strong style={{ color: 'var(--brand-primary)' }}>{offer.lastAdCount}</strong> ads ativos
                            </span>
                        </div>
                    )}
                    <Button
                        variant="secondary"
                        onClick={handleSync}
                        disabled={isSyncing}
                        icon={<RefreshCw size={15} />}
                    >
                        Sincronizar Ads
                    </Button>
                </div>
            </div>

            <style>{`
                @keyframes slideProgress {
                    0% { transform: translateX(-200%); }
                    100% { transform: translateX(400%); }
                }
            `}</style>

            <OfferForm key={offer.id} initialData={offer} offerId={offer.id} isEditing />

            {/* ── Sync History ── */}
            <div style={{ marginTop: 40, borderTop: '1px solid var(--border-secondary)', paddingTop: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <History size={20} style={{ color: 'var(--brand-primary)' }} />
                    <h2 style={{ fontSize: 18, fontWeight: 700 }}>Histórico de Sincronizações</h2>
                </div>

                {snapshots.length > 0 ? (
                    <div style={{ overflowX: 'auto', background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border-secondary)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-secondary)', background: 'var(--bg-elevated)' }}>
                                    <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Data</th>
                                    <th style={{ textAlign: 'center', padding: '12px 16px', color: 'var(--text-muted)' }}>Anúncios</th>
                                    <th style={{ textAlign: 'center', padding: '12px 16px', color: 'var(--text-muted)' }}>Criativos</th>
                                    <th style={{ textAlign: 'center', padding: '12px 16px', color: 'var(--text-muted)' }}>Itens Brutos (Dataset)</th>
                                    <th style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--text-muted)' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {snapshots.map((snap) => (
                                    <tr key={snap.id} style={{ borderBottom: '1px solid var(--border-secondary)' }}>
                                        <td style={{ padding: '12px 16px', fontWeight: 600 }}>{snap.id}</td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                            <span style={{ color: 'var(--brand-primary)', fontWeight: 700 }}>{snap.adCount}</span>
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>{snap.creatives?.length || 0}</td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                            {snap.debugRawItems ?? '—'}
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, color: '#00d4aa', fontSize: 11 }}>
                                                <CheckCircle size={12} />
                                                SUCESSO
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={{
                        padding: '32px', textAlign: 'center', background: 'var(--bg-card)',
                        borderRadius: 12, border: '1px dashed var(--border-secondary)',
                        color: 'var(--text-muted)', fontSize: 14,
                    }}>
                        Nenhuma sincronização realizada ainda. Clique em "Sincronizar Ads" para começar.
                    </div>
                )}

                <div style={{ marginTop: 16, display: 'flex', alignItems: 'flex-start', gap: 8, padding: 12, background: 'rgba(0,212,170,0.05)', borderRadius: 8 }}>
                    <Info size={16} style={{ color: 'var(--brand-primary)', flexShrink: 0, marginTop: 2 }} />
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        <strong>Dica:</strong> Se o "Itens Brutos" for alto mas os "Anúncios" forem 0, significa que o Apify encontrou dados mas o sistema não conseguiu ler o texto/imagem.
                        Nesse caso, verifique se a URL da biblioteca está correta.
                    </p>
                </div>
            </div>
        </div>
    );
}
