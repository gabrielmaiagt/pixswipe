'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Bookmark,
    BookmarkCheck,
    Share2,
    Eye,
    DollarSign,
    TrendingUp,
    Target,
    Users,
    ShieldQuestion,
    Image,
    Video,
    FileText,
    MessageSquare,
    ClipboardList,
    Copy,
    Download,
    Check,
    Clock,
} from 'lucide-react';
import {
    doc,
    getDoc,
    setDoc,
    deleteDoc,
    collection,
    getDocs,
    orderBy,
    query,
    updateDoc,
    limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Badge, PlanBadge, StatusBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import type { Offer, Creative, FunnelStep, ChecklistItem, AdSnapshot } from '@/types';
import { copyToClipboard } from '@/lib/utils';
import Comments from '@/components/comments/Comments';
import toast from 'react-hot-toast';
import styles from './detail.module.css';

import { ExternalLink, Globe } from 'lucide-react';

type TabType = 'overview' | 'creatives' | 'funnel' | 'links' | 'monitoring' | 'implementation';

const OFFER_TYPE_LABEL: Record<string, string> = {
    x1: '🤝 X1',
    trafego_direto_brasil: '🇧🇷 Direto Brasil',
    trafego_direto_global: '🌐 Direto Global',
};

function buildTabs(offerType?: string, hasAdLibrary?: boolean): { key: TabType; label: string; icon: React.ReactNode }[] {
    const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
        { key: 'overview', label: 'Resumo', icon: <Target size={16} /> },
        { key: 'creatives', label: 'Criativos', icon: <Image size={16} /> },
    ];
    if (offerType === 'x1' || !offerType) {
        tabs.push({ key: 'funnel', label: 'Funil WhatsApp', icon: <MessageSquare size={16} /> });
    } else {
        tabs.push({ key: 'links', label: 'Links Úteis', icon: <Globe size={16} /> });
    }
    if (hasAdLibrary) {
        tabs.push({ key: 'monitoring', label: 'Monitoramento', icon: <TrendingUp size={16} /> });
    }
    tabs.push({ key: 'implementation', label: 'Implementação', icon: <ClipboardList size={16} /> });
    return tabs;
}

export default function OfferDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const { firebaseUser, userData } = useAuth();
    const [offer, setOffer] = useState<Offer | null>(null);
    const [creatives, setCreatives] = useState<Creative[]>([]);
    const [funnelSteps, setFunnelSteps] = useState<FunnelStep[]>([]);
    const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaved, setIsSaved] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [adSnapshots, setAdSnapshots] = useState<AdSnapshot[]>([]);
    const tabs = offer ? buildTabs(offer.offerType, !!offer.adLibraryUrl) : buildTabs();

    // Fetch offer and subcollections
    useEffect(() => {
        async function fetchAll() {
            setLoading(true);
            try {
                const offerSnap = await getDoc(doc(db, 'offers', id));
                if (!offerSnap.exists()) {
                    setOffer(null);
                    setLoading(false);
                    return;
                }
                setOffer({ id: offerSnap.id, ...offerSnap.data() } as Offer);

                // Creatives
                const crSnap = await getDocs(collection(db, 'offers', id, 'creatives'));
                setCreatives(crSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Creative)));

                // Funnel
                const fnSnap = await getDocs(
                    query(collection(db, 'offers', id, 'funnelSteps'), orderBy('order', 'asc'))
                );
                setFunnelSteps(fnSnap.docs.map((d) => ({ id: d.id, ...d.data() } as FunnelStep)));

                // Ad snapshots (last 30)
                const snapshotsSnap = await getDocs(
                    query(
                        collection(db, 'offers', id, 'adSnapshots'),
                        orderBy('scrapedAt', 'desc'),
                        limit(30)
                    )
                );
                const snapArr = snapshotsSnap.docs
                    .map((d) => ({ id: d.id, ...d.data() } as AdSnapshot))
                    .reverse(); // oldest first for chart
                setAdSnapshots(snapArr);

                // Checklist (user-specific)
                if (firebaseUser) {
                    const clSnap = await getDoc(
                        doc(db, 'users', firebaseUser.uid, 'progress', `checklist_${id}`)
                    );
                    if (clSnap.exists()) {
                        setChecklist((clSnap.data() as any).items || []);
                    }

                    // Check if saved
                    const savedSnap = await getDoc(
                        doc(db, 'users', firebaseUser.uid, 'saves', id)
                    );
                    setIsSaved(savedSnap.exists());
                }
            } catch (err) {
                console.error('Error fetching offer:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchAll();
    }, [id, firebaseUser]);

    // Toggle save
    const toggleSave = useCallback(async () => {
        if (!firebaseUser) return;
        const ref = doc(db, 'users', firebaseUser.uid, 'saves', id);
        if (isSaved) {
            await deleteDoc(ref);
            setIsSaved(false);
            toast.success('Removido dos salvos');
        } else {
            await setDoc(ref, { offerId: id, savedAt: new Date() });
            setIsSaved(true);
            toast.success('Salvo!');
        }
    }, [firebaseUser, id, isSaved]);

    // Toggle checklist item
    const toggleCheck = useCallback(
        async (itemId: string) => {
            if (!firebaseUser) return;
            const updated = checklist.map((c) =>
                c.id === itemId ? { ...c, checked: !c.checked } : c
            );
            setChecklist(updated);
            await setDoc(
                doc(db, 'users', firebaseUser.uid, 'progress', `checklist_${id}`),
                { items: updated }
            );
        },
        [firebaseUser, id, checklist]
    );

    // Share
    function handleShare() {
        const url = `${window.location.origin}/app/ofertas/${id}`;
        copyToClipboard(url);
        toast.success('Link copiado!');
    }

    // Download creative
    async function downloadCreative(creative: Creative) {
        if (creative.driveUrl) {
            window.open(creative.driveUrl, '_blank');
            return;
        }
        if (creative.storagePath) {
            try {
                const res = await fetch(`/api/download?path=${encodeURIComponent(creative.storagePath)}`);
                const data = await res.json();
                if (data.url) window.open(data.url, '_blank');
            } catch {
                toast.error('Erro ao baixar');
            }
        }
    }

    // Copy funnel text
    function copyFunnelStep(text: string) {
        copyToClipboard(text);
        toast.success('Mensagem copiada!');
    }

    function copyAllFunnel() {
        const all = funnelSteps.map((s, i) => `--- Etapa ${i + 1} ---\n${s.text}`).join('\n\n');
        copyToClipboard(all);
        toast.success('Funil completo copiado!');
    }

    if (loading) {
        return (
            <div className={styles.detailPage}>
                <div className={styles.detailSkeleton}>
                    <div className="skeleton" style={{ height: 24, width: 120 }} />
                    <div className="skeleton" style={{ height: 40, width: '80%' }} />
                    <div className="skeleton" style={{ height: 20, width: '40%' }} />
                    <div className="skeleton" style={{ height: 300 }} />
                </div>
            </div>
        );
    }

    if (!offer) {
        return (
            <div className={styles.detailPage}>
                <Link href="/app/ofertas" className={styles.backLink}>
                    <ArrowLeft size={16} /> Voltar
                </Link>
                <div className={styles.summaryCard}>
                    <h3>Oferta não encontrada</h3>
                    <p>Esta oferta pode ter sido removida ou o link está incorreto.</p>
                </div>
            </div>
        );
    }

    const funnelLabels: Record<string, string> = {
        qualificacao: 'Qualificação',
        prova: 'Prova',
        pitch: 'Pitch',
        fechamento: 'Fechamento',
    };

    const creativeIcons: Record<string, React.ReactNode> = {
        image: <Image size={24} />,
        video: <Video size={24} />,
        text: <FileText size={24} />,
    };

    // Plan Restriction Check
    const hasPlanAccess = userData && (
        userData.role === 'admin' ||
        offer.availableOnPlans.includes(userData.plan)
    );

    if (!hasPlanAccess) {
        return (
            <div className={styles.detailPage}>
                <Link href="/app/ofertas" className={styles.backLink}>
                    <ArrowLeft size={16} /> Voltar para ofertas
                </Link>
                <div className={styles.restrictedCard}>
                    <div className={styles.lockIcon}><ShieldQuestion size={48} /></div>
                    <h2>Conteúdo Restrito</h2>
                    <p>
                        Esta oferta está disponível apenas para membros dos planos {offer.availableOnPlans.join(', ')}.
                        Seu plano atual é <strong>{userData?.plan}</strong>.
                    </p>
                    <Link href="/#precos">
                        <Button variant="primary">Fazer Upgrade Agora</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.detailPage}>
            <Link href="/app/ofertas" className={styles.backLink}>
                <ArrowLeft size={16} /> Voltar para ofertas
            </Link>

            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerTop}>
                    <h1 className={styles.title}>{offer.title}</h1>
                    <div className={styles.headerActions}>
                        <button
                            className={`${styles.iconBtn} ${isSaved ? styles.iconBtnActive : ''}`}
                            onClick={toggleSave}
                            title={isSaved ? 'Remover dos salvos' : 'Salvar'}
                        >
                            {isSaved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                        </button>
                        <button
                            className={styles.iconBtn}
                            onClick={handleShare}
                            title="Copiar link"
                        >
                            <Share2 size={18} />
                        </button>
                    </div>
                </div>

                <div className={styles.badges}>
                    {offer.offerType && (
                        <span style={{
                            fontSize: '12px', fontWeight: 700, padding: '3px 10px',
                            borderRadius: 'var(--radius-full)', background: 'var(--bg-tertiary)',
                            color: 'var(--brand-primary)', border: '1px solid rgba(0,212,170,0.2)',
                        }}>
                            {OFFER_TYPE_LABEL[offer.offerType] || offer.offerType}
                        </span>
                    )}
                    {offer.offerLabel && (
                        <span style={{
                            fontSize: '11px', fontWeight: 600, padding: '3px 10px',
                            borderRadius: 'var(--radius-full)', background: 'var(--bg-tertiary)',
                            color: 'var(--text-secondary)', border: '1px solid var(--border-secondary)',
                        }}>
                            {offer.offerLabel === 'white' ? '⚪ White' : '⚫ Black'}
                        </span>
                    )}
                    {offer.availableOnPlans.map((plan) => (
                        <PlanBadge key={plan} plan={plan} />
                    ))}
                    {offer.scalingBadge && <Badge variant="scaling">Escalando</Badge>}
                    {offer.featured && <Badge variant="updated">Destaque</Badge>}
                </div>

                <div className={styles.metaRow}>
                    <span className={styles.metaItem}>
                        <DollarSign size={14} />
                        Ticket: <span className={styles.metaValue}>R${offer.ticket.toFixed(2).replace('.', ',')}</span>
                    </span>
                    <span className={styles.metaItem}>
                        <Eye size={14} />
                        <span className={styles.metaValue}>{offer.views}</span> visualizações
                    </span>
                    <span className={styles.metaItem}>
                        <Bookmark size={14} />
                        <span className={styles.metaValue}>{offer.saves}</span> salvos
                    </span>
                </div>
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
            >
                {/* === Overview === */}
                {activeTab === 'overview' && (
                    <>
                        {offer.summary && (
                            <div className={styles.summaryGrid}>
                                <div className={styles.summaryCard}>
                                    <h4><Target size={14} /> Promessa</h4>
                                    <p>{offer.summary.promise}</p>
                                </div>
                                <div className={styles.summaryCard}>
                                    <h4><TrendingUp size={14} /> Mecanismo</h4>
                                    <p>{offer.summary.mechanism}</p>
                                </div>
                                <div className={styles.summaryCard}>
                                    <h4><Users size={14} /> Público</h4>
                                    <p>{offer.summary.audience}</p>
                                </div>
                                <div className={styles.summaryCard}>
                                    <h4><ShieldQuestion size={14} /> Objeções</h4>
                                    <p>{offer.summary.objections}</p>
                                </div>
                            </div>
                        )}

                        {/* Links section — always shown if any link exists */}
                        {(offer.adLibraryUrl || offer.checkoutUrl || offer.siteUrl) && (
                            <div className={styles.linksSection}>
                                <h4 className={styles.linksSectionTitle}>Links</h4>
                                <div className={styles.linksList}>
                                    {offer.adLibraryUrl && (
                                        <a href={offer.adLibraryUrl} target="_blank" rel="noopener noreferrer" className={styles.linkRow}>
                                            <ExternalLink size={14} />
                                            <span>Biblioteca de Anúncios</span>
                                        </a>
                                    )}
                                    {offer.checkoutUrl && (
                                        <a href={offer.checkoutUrl} target="_blank" rel="noopener noreferrer" className={styles.linkRow}>
                                            <ExternalLink size={14} />
                                            <span>Checkout</span>
                                        </a>
                                    )}
                                    {offer.siteUrl && (
                                        <a href={offer.siteUrl} target="_blank" rel="noopener noreferrer" className={styles.linkRow}>
                                            <Globe size={14} />
                                            <span>Site / Landing Page</span>
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}

                        {offer.tags.length > 0 && (
                            <div className={styles.tagsRow}>
                                {offer.tags.map((tag) => (
                                    <span key={tag} className={styles.tag}>{tag}</span>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* === Creatives === */}
                {activeTab === 'creatives' && (
                    <div className={styles.creativesGrid}>
                        {creatives.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)' }}>
                                Nenhum criativo adicionado ainda.
                            </p>
                        ) : (
                            creatives.map((creative) => (
                                <div key={creative.id} className={styles.creativeCard}>
                                    <div className={styles.creativePreview}>
                                        {creative.type === 'image' && creative.storagePath ? (
                                            <div style={{ color: 'var(--text-muted)' }}>
                                                <Image size={32} />
                                            </div>
                                        ) : (
                                            creativeIcons[creative.type] || <FileText size={32} />
                                        )}
                                    </div>
                                    <div className={styles.creativeBody}>
                                        <div className={styles.creativeType}>{creative.type}</div>
                                        {creative.caption && (
                                            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', marginBottom: 8 }}>
                                                {creative.caption}
                                            </p>
                                        )}
                                        <div className={styles.creativeActions}>
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                icon={<Download size={14} />}
                                                onClick={() => downloadCreative(creative)}
                                            >
                                                Baixar
                                            </Button>
                                            {creative.caption && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    icon={<Copy size={14} />}
                                                    onClick={() => {
                                                        copyToClipboard(creative.caption || '');
                                                        toast.success('Legenda copiada!');
                                                    }}
                                                >
                                                    Copy
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* === WhatsApp Funnel (X1 only) === */}
                {activeTab === 'funnel' && (
                    <>
                        {/* Funnel videos */}
                        {offer.funnelVideoUrls && offer.funnelVideoUrls.length > 0 && (
                            <div style={{ marginBottom: 24 }}>
                                <h4 style={{ fontSize: 'var(--font-sm)', fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>
                                    <Video size={14} style={{ display: 'inline', marginRight: 6 }} />
                                    Vídeos do Funil
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {offer.funnelVideoUrls.map((url, i) => (
                                        <video
                                            key={i}
                                            src={url}
                                            controls
                                            style={{ width: '100%', borderRadius: 'var(--radius-md)', background: '#000', maxHeight: 360 }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className={styles.funnelList}>
                            {funnelSteps.length === 0 ? (
                                <p style={{ color: 'var(--text-secondary)' }}>
                                    Nenhuma etapa do funil adicionada ainda.
                                </p>
                            ) : (
                                funnelSteps.map((step, i) => (
                                    <div key={step.id} className={styles.funnelStep}>
                                        <div className={styles.funnelStepNumber}>{i + 1}</div>
                                        <div className={styles.funnelStepContent}>
                                            <div className={styles.funnelStepLabel}>
                                                {funnelLabels[step.label] || step.label}
                                            </div>
                                            <div className={styles.funnelStepText}>{step.text}</div>
                                            {step.delayMinutes > 0 && (
                                                <div className={styles.funnelStepDelay}>
                                                    <Clock size={12} /> Enviar após {step.delayMinutes} min
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            className={`${styles.iconBtn} ${styles.funnelCopyBtn}`}
                                            onClick={() => copyFunnelStep(step.text)}
                                            title="Copiar mensagem"
                                        >
                                            <Copy size={14} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                        {funnelSteps.length > 0 && (
                            <div className={styles.copyAllBtn}>
                                <Button
                                    variant="secondary"
                                    icon={<Copy size={16} />}
                                    onClick={copyAllFunnel}
                                >
                                    Copiar funil completo
                                </Button>
                            </div>
                        )}
                    </>
                )}

                {/* === Links tab (Tráfego Direto) === */}
                {activeTab === 'links' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {!offer.adLibraryUrl && !offer.checkoutUrl && !offer.siteUrl ? (
                            <p style={{ color: 'var(--text-secondary)' }}>Nenhum link cadastrado para esta oferta.</p>
                        ) : (
                            <>
                                {offer.adLibraryUrl && (
                                    <a href={offer.adLibraryUrl} target="_blank" rel="noopener noreferrer" className={styles.bigLinkRow}>
                                        <ExternalLink size={18} />
                                        <div>
                                            <div style={{ fontWeight: 700 }}>Biblioteca de Anúncios</div>
                                            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: 2 }}>{offer.adLibraryUrl}</div>
                                        </div>
                                    </a>
                                )}
                                {offer.checkoutUrl && (
                                    <a href={offer.checkoutUrl} target="_blank" rel="noopener noreferrer" className={styles.bigLinkRow}>
                                        <ExternalLink size={18} />
                                        <div>
                                            <div style={{ fontWeight: 700 }}>Checkout</div>
                                            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: 2 }}>{offer.checkoutUrl}</div>
                                        </div>
                                    </a>
                                )}
                                {offer.siteUrl && (
                                    <a href={offer.siteUrl} target="_blank" rel="noopener noreferrer" className={styles.bigLinkRow}>
                                        <Globe size={18} />
                                        <div>
                                            <div style={{ fontWeight: 700 }}>Site / Landing Page</div>
                                            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: 2 }}>{offer.siteUrl}</div>
                                        </div>
                                    </a>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* === Monitoramento (Apify) === */}
                {activeTab === 'monitoring' && (() => {
                    const maxCount = Math.max(...adSnapshots.map(s => s.adCount), 1);

                    // Aggregate creatives across all snapshots: unique URL, max frequency found
                    const aggregatedCreatives = new Map<string, { url: string, count: number, type: 'image' | 'video' }>();
                    adSnapshots.forEach(snap => {
                        (snap.creatives || []).forEach(c => {
                            const existing = aggregatedCreatives.get(c.url);
                            if (!existing || c.count > existing.count) {
                                aggregatedCreatives.set(c.url, c);
                            }
                        });
                    });

                    const allCreatives = Array.from(aggregatedCreatives.values())
                        .sort((a, b) => b.count - a.count);

                    const allLandingUrls = [...new Set(adSnapshots.flatMap(s => s.landingUrls || []))];
                    const latest = adSnapshots[adSnapshots.length - 1];
                    const prev = adSnapshots[adSnapshots.length - 2];
                    const trend = latest && prev ? latest.adCount - prev.adCount : 0;

                    return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                            {/* ── Stat cards ── */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
                                {/* Active ads */}
                                <div style={{
                                    background: 'linear-gradient(135deg, rgba(0,212,170,0.12), rgba(0,212,170,0.04))',
                                    border: '1px solid rgba(0,212,170,0.25)', borderRadius: 14, padding: '18px 20px',
                                }}>
                                    <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(0,212,170,0.7)', marginBottom: 6 }}>Anúncios ativos</div>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                                        <span style={{ fontSize: 34, fontWeight: 800, color: '#00d4aa', lineHeight: 1 }}>
                                            {offer.lastAdCount ?? '—'}
                                        </span>
                                        {trend !== 0 && (
                                            <span style={{ fontSize: 13, fontWeight: 600, color: trend > 0 ? '#00d4aa' : '#ff6b6b' }}>
                                                {trend > 0 ? `+${trend}` : trend}
                                            </span>
                                        )}
                                    </div>
                                    {offer.lastSyncedAt && (
                                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>
                                            Atualizado {new Date((offer.lastSyncedAt as any).seconds * 1000).toLocaleDateString('pt-BR')}
                                        </div>
                                    )}
                                </div>

                                {/* Creatives */}
                                <div style={{
                                    background: 'var(--bg-card)', border: '1px solid var(--border-secondary)',
                                    borderRadius: 14, padding: '18px 20px',
                                }}>
                                    <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 6 }}>Criativos</div>
                                    <div style={{ fontSize: 34, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{allCreatives.length}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>imagens e vídeos</div>
                                </div>

                                {/* Days monitored */}
                                <div style={{
                                    background: 'var(--bg-card)', border: '1px solid var(--border-secondary)',
                                    borderRadius: 14, padding: '18px 20px',
                                }}>
                                    <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 6 }}>Dias monitorados</div>
                                    <div style={{ fontSize: 34, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{adSnapshots.length}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>syncs realizados</div>
                                </div>
                            </div>

                            {/* ── Bar chart ── */}
                            <div style={{
                                background: 'var(--bg-card)', border: '1px solid var(--border-secondary)',
                                borderRadius: 16, padding: '20px 24px',
                            }}>
                                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>
                                    Histórico de anúncios ativos
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 18 }}>
                                    Cada barra representa um sync — cresce conforme o admin sincroniza diariamente
                                </div>

                                {adSnapshots.length > 0 ? (
                                    <>
                                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 100, position: 'relative' }}>
                                            {adSnapshots.map((snap) => {
                                                const h = maxCount > 0 ? Math.round((snap.adCount / maxCount) * 88) + 12 : 12;
                                                return (
                                                    <div
                                                        key={snap.id}
                                                        style={{ flex: 1, minWidth: 8, position: 'relative' }}
                                                    >
                                                        <div
                                                            title={`${snap.id}: ${snap.adCount} ads`}
                                                            style={{
                                                                height: h, borderRadius: '4px 4px 2px 2px',
                                                                background: snap === latest
                                                                    ? 'var(--brand-primary)'
                                                                    : 'rgba(0,212,170,0.35)',
                                                                transition: 'background 0.15s, transform 0.15s',
                                                                cursor: 'default',
                                                            }}
                                                            onMouseEnter={e => {
                                                                e.currentTarget.style.background = 'var(--brand-primary)';
                                                                e.currentTarget.style.transform = 'scaleY(1.04)';
                                                                e.currentTarget.style.transformOrigin = 'bottom';
                                                            }}
                                                            onMouseLeave={e => {
                                                                e.currentTarget.style.background = snap === latest ? 'var(--brand-primary)' : 'rgba(0,212,170,0.35)';
                                                                e.currentTarget.style.transform = 'scaleY(1)';
                                                            }}
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 11, color: 'var(--text-muted)' }}>
                                            <span>{adSnapshots[0]?.id}</span>
                                            {adSnapshots.length > 2 && <span style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>{latest?.adCount} ads hoje</span>}
                                            <span>{latest?.id}</span>
                                        </div>
                                    </>
                                ) : (
                                    <div style={{
                                        height: 100, display: 'flex', flexDirection: 'column',
                                        alignItems: 'center', justifyContent: 'center',
                                        border: '1px dashed var(--border-secondary)', borderRadius: 10,
                                        gap: 8,
                                    }}>
                                        <span style={{ fontSize: 24 }}>📊</span>
                                        <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
                                            O gráfico vai aparecer aqui conforme o admin sincroniza diariamente
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* ── Landing pages ── */}
                            {allLandingUrls.length > 0 && (
                                <div style={{
                                    background: 'var(--bg-card)', border: '1px solid var(--border-secondary)',
                                    borderRadius: 16, padding: '20px 24px',
                                }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: 'var(--text-primary)' }}>
                                        Páginas de destino encontradas nos anúncios
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {allLandingUrls.slice(0, 8).map((url, i) => (
                                            <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                                                    background: 'var(--bg-tertiary)', borderRadius: 10,
                                                    textDecoration: 'none', fontSize: 12, color: 'var(--brand-primary)',
                                                    wordBreak: 'break-all',
                                                }}>
                                                <ExternalLink size={13} style={{ flexShrink: 0 }} />
                                                {url}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Creatives grid ── */}
                            {allCreatives.length > 0 ? (
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: 'var(--text-primary)' }}>
                                        Criativos capturados ({allCreatives.length})
                                    </div>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                                        gap: 12,
                                    }}>
                                        {allCreatives.map((creative, i) => {
                                            const isVideo = creative.type === 'video';
                                            const isScaled = creative.count > 2;

                                            return (
                                                <div key={i} style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: 'var(--bg-tertiary)' }}>
                                                    {/* Scaling Badge */}
                                                    {isScaled && (
                                                        <div style={{
                                                            position: 'absolute', top: 8, left: 8, zIndex: 10,
                                                            background: 'linear-gradient(to right, #ff8a00, #ff2000)',
                                                            color: '#fff', fontSize: 10, fontWeight: 800,
                                                            padding: '4px 8px', borderRadius: 20,
                                                            boxShadow: '0 4px 12px rgba(255,50,0,0.3)',
                                                            display: 'flex', alignItems: 'center', gap: 4,
                                                        }}>
                                                            <span>🔥 ESCALADO</span>
                                                            <span style={{ opacity: 0.8, fontSize: 9 }}>({creative.count} ads)</span>
                                                        </div>
                                                    )}

                                                    {isVideo ? (
                                                        <div style={{ position: 'relative', aspectRatio: '9/16' }}>
                                                            <video
                                                                src={creative.url}
                                                                controls
                                                                style={{
                                                                    width: '100%', height: '100%',
                                                                    background: '#000', objectFit: 'cover',
                                                                }}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <a href={creative.url} target="_blank" rel="noopener noreferrer"
                                                            style={{ display: 'block', position: 'relative', aspectRatio: '1' }}>
                                                            <img
                                                                src={creative.url}
                                                                alt={`Criativo ${i + 1}`}
                                                                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                                style={{
                                                                    width: '100%', height: '100%',
                                                                    objectFit: 'cover', display: 'block',
                                                                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                                }}
                                                                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
                                                                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                                                            />
                                                        </a>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                adSnapshots.length > 0 && (
                                    <div style={{
                                        padding: '40px', border: '1px dashed var(--border-secondary)',
                                        borderRadius: 20, textAlign: 'center', background: 'var(--bg-card)',
                                    }}>
                                        <div style={{ fontSize: 32, marginBottom: 12 }}>📸</div>
                                        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                                            Nenhum criativo capturado ainda. O Apify pode não ter encontrado imagens nesta biblioteca.
                                        </p>
                                    </div>
                                )
                            )}
                        </div>
                    );
                })()}

                {/* === Implementation Checklist === */}
                {activeTab === 'implementation' && (
                    <div className={styles.checklist}>
                        {checklist.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)' }}>
                                Nenhum checklist disponível para esta oferta.
                            </p>
                        ) : (
                            checklist.map((item) => (
                                <div
                                    key={item.id}
                                    className={`${styles.checkItem} ${item.checked ? styles.checkItemDone : ''}`}
                                    onClick={() => toggleCheck(item.id)}
                                >
                                    <div className={`${styles.checkbox} ${item.checked ? styles.checkboxChecked : ''}`}>
                                        {item.checked && <Check size={14} />}
                                    </div>
                                    <span className={styles.checkLabel}>{item.label}</span>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </motion.div>

            {/* Comments */}
            <Comments parentCollection="offers" parentId={id} />
        </div>
    );
}

