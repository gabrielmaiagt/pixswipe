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
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Badge, PlanBadge, StatusBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import type { Offer, Creative, FunnelStep, ChecklistItem } from '@/types';
import { copyToClipboard } from '@/lib/utils';
import Comments from '@/components/comments/Comments';
import toast from 'react-hot-toast';
import styles from './detail.module.css';

type TabType = 'overview' | 'creatives' | 'funnel' | 'implementation';

const TABS: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Resumo', icon: <Target size={16} /> },
    { key: 'creatives', label: 'Criativos', icon: <Image size={16} /> },
    { key: 'funnel', label: 'Funil WhatsApp', icon: <MessageSquare size={16} /> },
    { key: 'implementation', label: 'Implementação', icon: <ClipboardList size={16} /> },
];

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
                {TABS.map((tab) => (
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

                        {(offer.referenceCpl || offer.referenceRoas || offer.referenceTicket) && (
                            <div className={styles.metricsGrid}>
                                {offer.referenceCpl && (
                                    <div className={styles.metricCard}>
                                        <div className={styles.metricValue}>
                                            R${offer.referenceCpl.toFixed(2).replace('.', ',')}
                                        </div>
                                        <div className={styles.metricLabel}>CPL Referência</div>
                                    </div>
                                )}
                                {offer.referenceRoas && (
                                    <div className={styles.metricCard}>
                                        <div className={styles.metricValue}>{offer.referenceRoas}x</div>
                                        <div className={styles.metricLabel}>ROAS Referência</div>
                                    </div>
                                )}
                                {offer.referenceTicket && (
                                    <div className={styles.metricCard}>
                                        <div className={styles.metricValue}>
                                            R${offer.referenceTicket.toFixed(2).replace('.', ',')}
                                        </div>
                                        <div className={styles.metricLabel}>Ticket Referência</div>
                                    </div>
                                )}
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

                {/* === WhatsApp Funnel === */}
                {activeTab === 'funnel' && (
                    <>
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
                                    <div
                                        className={`${styles.checkbox} ${item.checked ? styles.checkboxChecked : ''}`}
                                    >
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
