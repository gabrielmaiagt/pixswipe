'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Input, Textarea, Select } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import {
    Save, X, Loader2, Image as ImageIcon, Video, Plus, Trash2, Sparkles, ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Offer, OfferStatus, OfferType, OfferLabel, CreativeStorageType, PlanType } from '@/types';
import AssetManager from './AssetManager';
import FileUpload from './FileUpload';
import styles from './OfferForm.module.css';

interface OfferFormProps {
    initialData?: Partial<Offer>;
    offerId?: string;
    isEditing?: boolean;
}

export default function OfferForm({ initialData, offerId, isEditing }: OfferFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showGallery, setShowGallery] = useState(false);
    const [funnelVideos, setFunnelVideos] = useState<string[]>(initialData?.funnelVideoUrls || []);
    const [newVideoUrl, setNewVideoUrl] = useState('');
    const [importing, setImporting] = useState(false);
    const [importPreview, setImportPreview] = useState<{ bestAdText: string; landingUrls: string[]; creativeUrls: string[] } | null>(null);

    const [form, setForm] = useState({
        title: initialData?.title || '',
        niche: initialData?.niche || '',
        ticket: initialData?.ticket || 0,
        status: (initialData?.status as OfferStatus) || 'draft',
        offerType: (initialData?.offerType as OfferType) || 'x1',
        offerLabel: (initialData?.offerLabel as OfferLabel) || '',
        // Summary (all optional)
        promise: initialData?.summary?.promise || '',
        mechanism: initialData?.summary?.mechanism || '',
        audience: initialData?.summary?.audience || '',
        objections: initialData?.summary?.objections || '',
        // Links
        adLibraryUrl: initialData?.adLibraryUrl || '',
        checkoutUrl: initialData?.checkoutUrl || '',
        siteUrl: initialData?.siteUrl || '',
        funnelNumber: initialData?.funnelNumber || '',
        // Meta
        tags: initialData?.tags?.join(', ') || '',
        featured: initialData?.featured || false,
        scalingBadge: initialData?.scalingBadge || false,
        availableOnPlans: initialData?.availableOnPlans || ['starter', 'pro', 'annual'],
        referenceCpl: initialData?.referenceCpl || 0,
        referenceRoas: initialData?.referenceRoas || 0,
        creativeStorageType: (initialData?.creativeStorageType as CreativeStorageType) || 'drive',
        thumbnailUrl: initialData?.thumbnailUrl || '',
    });

    const isX1 = form.offerType === 'x1';
    const isTrafegoDireto = form.offerType === 'trafego_direto_brasil' || form.offerType === 'trafego_direto_global';

    async function handleImport() {
        if (!form.adLibraryUrl) {
            toast.error('Cole a URL da Biblioteca de Anúncios primeiro.');
            return;
        }
        setImporting(true);
        setImportPreview(null);
        try {
            const res = await fetch('/api/admin/import-offer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adLibraryUrl: form.adLibraryUrl }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erro ao importar');

            // Auto-fill form fields
            setForm(prev => ({
                ...prev,
                // Fill title only if empty
                title: prev.title || data.pageName || prev.title,
                // First landing page URL as site
                siteUrl: prev.siteUrl || data.landingUrls?.[0] || prev.siteUrl,
                // Thumbnail from first creative
                thumbnailUrl: prev.thumbnailUrl || data.thumbnailUrl || prev.thumbnailUrl,
            }));

            // Show preview for manual use
            setImportPreview({
                bestAdText: data.bestAdText,
                landingUrls: data.landingUrls || [],
                creativeUrls: data.creativeUrls || [],
            });

            toast.success(`Importado: ${data.adCount} anúncios encontrados`);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setImporting(false);
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'number' ? parseFloat(value) : value;
        setForm((prev) => ({ ...prev, [name]: val }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setForm((prev) => ({ ...prev, [name]: checked }));
    };

    const handlePlanChange = (plan: PlanType) => {
        setForm((prev) => {
            const plans = prev.availableOnPlans.includes(plan)
                ? prev.availableOnPlans.filter((p) => p !== plan)
                : [...prev.availableOnPlans, plan];
            return { ...prev, availableOnPlans: plans };
        });
    };

    function addFunnelVideo() {
        const url = newVideoUrl.trim();
        if (!url) return;
        setFunnelVideos((prev) => [...prev, url]);
        setNewVideoUrl('');
    }

    function removeFunnelVideo(idx: number) {
        setFunnelVideos((prev) => prev.filter((_, i) => i !== idx));
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const hasSummary = form.promise || form.mechanism || form.audience || form.objections;

            const offerData = {
                title: form.title,
                niche: form.niche,
                ticket: form.ticket,
                status: form.status as OfferStatus,
                offerType: form.offerType as OfferType,
                ...(form.offerLabel ? { offerLabel: form.offerLabel as OfferLabel } : {}),
                ...(hasSummary ? {
                    summary: {
                        promise: form.promise,
                        mechanism: form.mechanism,
                        audience: form.audience,
                        objections: form.objections,
                    }
                } : {}),
                tags: form.tags.split(',').map((t) => t.trim()).filter((t) => t),
                featured: form.featured,
                scalingBadge: form.scalingBadge,
                availableOnPlans: form.availableOnPlans as PlanType[],
                creativeStorageType: form.creativeStorageType as CreativeStorageType,
                ...(form.thumbnailUrl ? { thumbnailUrl: form.thumbnailUrl } : {}),
                ...(form.adLibraryUrl ? { adLibraryUrl: form.adLibraryUrl } : {}),
                ...(form.checkoutUrl ? { checkoutUrl: form.checkoutUrl } : {}),
                ...(isTrafegoDireto && form.siteUrl ? { siteUrl: form.siteUrl } : {}),
                ...(isX1 && form.funnelNumber ? { funnelNumber: form.funnelNumber } : {}),
                ...(isX1 ? { funnelVideoUrls: funnelVideos } : {}),
                updatedAt: serverTimestamp(),
            };


            if (isEditing && offerId) {
                await updateDoc(doc(db, 'offers', offerId), offerData as any);
                toast.success('Oferta atualizada com sucesso!');
            } else {
                const newDocRef = doc(db, 'offers', offerId || Math.random().toString(36).substring(7));
                await setDoc(newDocRef, {
                    ...offerData,
                    createdAt: serverTimestamp(),
                    views: 0,
                    saves: 0,
                    version: 1,
                });
                toast.success('Oferta criada com sucesso!');
            }

            router.push('/admin/ofertas');
            router.refresh();
        } catch (err) {
            console.error('Save offer error:', err);
            toast.error('Erro ao salvar oferta');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className={styles.form} onSubmit={handleSubmit}>

            {/* ── Seção 1: Básico ── */}
            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Informações Básicas</h3>
                <Input
                    label="Título da Oferta"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    required
                    placeholder="Ex: Método Seca Barriga"
                />
                <div className={styles.row}>
                    <Input
                        label="Nicho"
                        name="niche"
                        value={form.niche}
                        onChange={handleChange}
                        required
                        placeholder="Ex: Emagrecimento"
                    />
                    <Input
                        label="Ticket do Produto (R$)"
                        name="ticket"
                        type="number"
                        step="0.01"
                        value={form.ticket}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className={styles.row}>
                    <Select
                        label="Status"
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                        options={[
                            { value: 'draft', label: 'Rascunho' },
                            { value: 'published', label: 'Publicado' },
                            { value: 'archived', label: 'Arquivado' },
                        ]}
                    />
                    <Select
                        label="Armazenamento de Criativos"
                        name="creativeStorageType"
                        value={form.creativeStorageType}
                        onChange={handleChange}
                        options={[
                            { value: 'drive', label: 'Google Drive' },
                            { value: 'firebase', label: 'Firebase Storage' },
                        ]}
                    />
                </div>
                {/* Thumbnail */}
                <div>
                    <label style={{ display: 'block', fontSize: 'var(--font-sm)', fontWeight: 600, marginBottom: 10, color: 'var(--text-primary)' }}>
                        Thumbnail da Oferta
                    </label>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        {/* Preview */}
                        <div style={{
                            width: 140, height: 100, borderRadius: 10, overflow: 'hidden',
                            background: 'var(--bg-tertiary)', border: '1px solid var(--border-secondary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                            {form.thumbnailUrl ? (
                                <img src={form.thumbnailUrl} alt="thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <ImageIcon size={28} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
                            )}
                        </div>
                        {/* Upload + URL */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 220 }}>
                            <FileUpload
                                onUploadComplete={(url) => setForm(prev => ({ ...prev, thumbnailUrl: url }))}
                                folder="thumbnails"
                                label="📤 Fazer upload de imagem"
                                accept="image/*"
                            />
                            <Input
                                label="Ou colar URL da imagem"
                                name="thumbnailUrl"
                                value={form.thumbnailUrl}
                                onChange={handleChange}
                                placeholder="https://sua-imagem.com/thumb.jpg"
                            />
                            {form.thumbnailUrl && (
                                <button
                                    type="button"
                                    onClick={() => setForm(prev => ({ ...prev, thumbnailUrl: '' }))}
                                    style={{ fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', textAlign: 'left' }}
                                >
                                    ✕ Remover imagem
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Seção 2: Tipo da Oferta ── */}
            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Tipo da Oferta</h3>
                <div className={styles.row}>
                    <Select
                        label="Tipo"
                        name="offerType"
                        value={form.offerType}
                        onChange={handleChange}
                        options={[
                            { value: 'x1', label: '🤝 X1 (WhatsApp)' },
                            { value: 'trafego_direto_brasil', label: '🇧🇷 Tráfego Direto Brasil' },
                            { value: 'trafego_direto_global', label: '🌐 Tráfego Direto Global' },
                        ]}
                    />
                    <Select
                        label="White ou Black?"
                        name="offerLabel"
                        value={form.offerLabel}
                        onChange={handleChange}
                        options={[
                            { value: '', label: 'Não definido' },
                            { value: 'white', label: '⚪ White' },
                            { value: 'black', label: '⚫ Black' },
                        ]}
                    />
                </div>
            </div>

            {/* ── Seção 3: Links ── */}
            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Links</h3>

                {/* Ad Library field with Import button */}
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                        <Input
                            label="Biblioteca de Anúncios (Meta Ad Library)"
                            name="adLibraryUrl"
                            value={form.adLibraryUrl}
                            onChange={handleChange}
                            placeholder="https://www.facebook.com/ads/library/..."
                        />
                    </div>
                    <div style={{ marginBottom: 16 }}>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleImport}
                            disabled={importing}
                            icon={importing ? <Loader2 size={15} className="spin" /> : <Sparkles size={15} />}
                        >
                            {importing ? 'Importando...' : 'Importar'}
                        </Button>
                    </div>
                </div>

                {/* Import Preview */}
                {importPreview && (
                    <div style={{
                        background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.2)',
                        borderRadius: 12, padding: 16, marginBottom: 8,
                    }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-primary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            ✨ Dados importados do Apify
                        </div>

                        {importPreview.landingUrls.length > 0 && (
                            <div style={{ marginBottom: 10 }}>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Landing pages encontradas:</div>
                                {importPreview.landingUrls.slice(0, 3).map((u, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                        <a href={u} target="_blank" rel="noopener noreferrer"
                                            style={{ fontSize: 12, color: 'var(--brand-primary)', wordBreak: 'break-all' }}>
                                            <ExternalLink size={11} style={{ display: 'inline', marginRight: 4 }} />{u}
                                        </a>
                                        <button type="button" onClick={() => setForm(p => ({ ...p, siteUrl: u }))}
                                            style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', cursor: 'pointer' }}>
                                            ← usar
                                        </button>
                                        <button type="button" onClick={() => setForm(p => ({ ...p, checkoutUrl: u }))}
                                            style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', cursor: 'pointer' }}>
                                            ← checkout
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {importPreview.bestAdText && (
                            <div style={{ marginBottom: 10 }}>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Texto do anúncio (para inspirar o resumo):</div>
                                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, maxHeight: 80, overflow: 'hidden' }}>
                                    {importPreview.bestAdText.slice(0, 300)}{importPreview.bestAdText.length > 300 ? '...' : ''}
                                </p>
                            </div>
                        )}

                        {importPreview.creativeUrls.length > 0 && (
                            <div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                                    {importPreview.creativeUrls.length} criativos capturados — clique para usar como thumbnail:
                                </div>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {importPreview.creativeUrls.slice(0, 6).map((url, i) => (
                                        <img
                                            key={i}
                                            src={url}
                                            alt={`criativo ${i + 1}`}
                                            onClick={() => setForm(p => ({ ...p, thumbnailUrl: url }))}
                                            style={{
                                                width: 64, height: 64, objectFit: 'cover', borderRadius: 8, cursor: 'pointer',
                                                border: form.thumbnailUrl === url ? '2px solid var(--brand-primary)' : '2px solid transparent',
                                                transition: 'border 0.15s',
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={() => setImportPreview(null)}
                            style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10, cursor: 'pointer', display: 'block' }}
                        >
                            ✕ Fechar preview
                        </button>
                    </div>
                )}
                <Input
                    label="Link de Checkout"
                    name="checkoutUrl"
                    value={form.checkoutUrl}
                    onChange={handleChange}
                    placeholder="https://checkout.exemplo.com/..."
                />
                {isTrafegoDireto && (
                    <Input
                        label="Site / Landing Page"
                        name="siteUrl"
                        value={form.siteUrl}
                        onChange={handleChange}
                        placeholder="https://siteexemplo.com"
                    />
                )}
                {isX1 && (
                    <Input
                        label="Número do Funil (opcional)"
                        name="funnelNumber"
                        value={form.funnelNumber}
                        onChange={handleChange}
                        placeholder="Ex: Funil 03"
                    />
                )}
            </div>

            {/* ── Seção 4: Vídeos do Funil (só X1) ── */}
            {isX1 && (
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>
                        <Video size={16} style={{ display: 'inline', marginRight: 6 }} />
                        Vídeos do Funil (WhatsApp)
                    </h3>
                    <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', marginBottom: 16 }}>
                        Adicione gravações de tela mostrando o funil do WhatsApp. Aparecem para os usuários como referência.
                    </p>

                    {/* Upload de arquivo direto */}
                    <div style={{ marginBottom: 12 }}>
                        <FileUpload
                            folder="funnel-videos"
                            label="Fazer upload de vídeo"
                            accept="video/*"
                            onUploadComplete={(url) => setFunnelVideos((prev) => [...prev, url])}
                        />
                    </div>

                    {/* Ou colar URL */}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                        <div style={{ flex: 1 }}>
                            <Input
                                label="Ou colar URL do vídeo"
                                value={newVideoUrl}
                                onChange={(e) => setNewVideoUrl(e.target.value)}
                                placeholder="https://..."
                            />
                        </div>
                        <Button type="button" variant="secondary" onClick={addFunnelVideo} style={{ marginBottom: 16 }}>
                            <Plus size={16} /> Adicionar
                        </Button>
                    </div>

                    {funnelVideos.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                            {funnelVideos.map((url, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
                                        padding: '10px 14px', border: '1px solid var(--border-secondary)',
                                    }}
                                >
                                    <Video size={14} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
                                    <span style={{
                                        flex: 1, fontSize: 'var(--font-xs)', color: 'var(--text-secondary)',
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                    }}>
                                        {url}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => removeFunnelVideo(idx)}
                                        style={{ color: 'var(--status-error)', flexShrink: 0 }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Seção 5: Resumo da Estratégia (opcional) ── */}
            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Resumo da Estratégia <span style={{ fontWeight: 400, fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>(opcional)</span></h3>
                <Textarea
                    label="Promessa Principal"
                    name="promise"
                    value={form.promise}
                    onChange={handleChange}
                    placeholder="O que o produto promete de forma impactante?"
                />
                <Textarea
                    label="Mecanismo Único"
                    name="mechanism"
                    value={form.mechanism}
                    onChange={handleChange}
                    placeholder="Como o produto funciona de forma diferente dos outros?"
                />
                <Textarea
                    label="Público-Alvo"
                    name="audience"
                    value={form.audience}
                    onChange={handleChange}
                    placeholder="Quem é o avatar ideal?"
                />
                <Textarea
                    label="Objeções Comuns"
                    name="objections"
                    value={form.objections}
                    onChange={handleChange}
                    placeholder="O que impede o cliente de comprar?"
                />
            </div>

            {/* ── Seção 6: Configurações de exibição ── */}
            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Configurações de Exibição</h3>
                <div className={styles.checkboxGroup}>
                    <label className={styles.checkboxLabel}>
                        <input type="checkbox" name="featured" checked={form.featured} onChange={handleCheckboxChange} />
                        Destaque (Aparece no topo)
                    </label>
                    <label className={styles.checkboxLabel}>
                        <input type="checkbox" name="scalingBadge" checked={form.scalingBadge} onChange={handleCheckboxChange} />
                        Selo de Escala (Hot Offer)
                    </label>
                </div>

                <div style={{ marginTop: 16 }}>
                    <label className={styles.sectionTitle} style={{ fontSize: 'var(--font-sm)' }}>Disponível nos Planos:</label>
                    <div className={styles.checkboxGroup}>
                        {(['starter', 'pro', 'annual'] as PlanType[]).map((plan) => (
                            <label key={plan} className={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={form.availableOnPlans.includes(plan)}
                                    onChange={() => handlePlanChange(plan)}
                                />
                                {plan.toUpperCase()}
                            </label>
                        ))}
                    </div>
                </div>

                <Input
                    label="Tags (separadas por vírgula)"
                    name="tags"
                    value={form.tags}
                    onChange={handleChange}
                    placeholder="Ex: emagrecimento, chá, detox"
                />
            </div>

            {/* ── Actions ── */}
            <div className={styles.actions}>
                <Button variant="secondary" type="button" onClick={() => router.back()} disabled={loading}>
                    <X size={16} /> Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
                    {isEditing ? 'Salvar Alterações' : 'Criar Oferta'}
                </Button>
            </div>

            {/* ── Gallery Modal ── */}
            {showGallery && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h3>Selecionar Asset</h3>
                            <button className={styles.closeBtn} onClick={() => setShowGallery(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <AssetManager onSelect={(url) => {
                                setForm(prev => ({ ...prev, thumbnailUrl: url }));
                                setShowGallery(false);
                                toast.success('Imagem selecionada');
                            }} />
                        </div>
                    </div>
                </div>
            )}
        </form>
    );
}
