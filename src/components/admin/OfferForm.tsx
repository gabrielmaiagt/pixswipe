'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Input, Textarea, Select } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Save, X, Loader2, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Offer, OfferStatus, CreativeStorageType, PlanType } from '@/types';
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

    const [form, setForm] = useState({
        title: initialData?.title || '',
        niche: initialData?.niche || '',
        ticket: initialData?.ticket || 0,
        status: (initialData?.status as OfferStatus) || 'draft',
        promise: initialData?.summary?.promise || '',
        mechanism: initialData?.summary?.mechanism || '',
        audience: initialData?.summary?.audience || '',
        objections: initialData?.summary?.objections || '',
        tags: initialData?.tags?.join(', ') || '',
        featured: initialData?.featured || false,
        scalingBadge: initialData?.scalingBadge || false,
        availableOnPlans: initialData?.availableOnPlans || ['starter', 'pro', 'annual'],
        referenceCpl: initialData?.referenceCpl || 0,
        referenceRoas: initialData?.referenceRoas || 0,
        referenceTicket: initialData?.referenceTicket || 0,
        creativeStorageType: (initialData?.creativeStorageType as CreativeStorageType) || 'drive',
        thumbnailUrl: initialData?.thumbnailUrl || '',
    });

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const offerData = {
                title: form.title,
                niche: form.niche,
                ticket: form.ticket,
                status: form.status,
                summary: {
                    promise: form.promise,
                    mechanism: form.mechanism,
                    audience: form.audience,
                    objections: form.objections,
                },
                tags: form.tags.split(',').map((t) => t.trim()).filter((t) => t),
                featured: form.featured,
                scalingBadge: form.scalingBadge,
                availableOnPlans: form.availableOnPlans,
                referenceCpl: form.referenceCpl,
                referenceRoas: form.referenceRoas,
                referenceTicket: form.referenceTicket,
                creativeStorageType: form.creativeStorageType,
                thumbnailUrl: form.thumbnailUrl,
                updatedAt: serverTimestamp(),
            };

            if (isEditing && offerId) {
                await updateDoc(doc(db, 'offers', offerId), offerData);
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
                <div className={styles.row} style={{ alignItems: 'flex-end', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                        <Input
                            label="Thumbnail URL"
                            name="thumbnailUrl"
                            value={form.thumbnailUrl}
                            onChange={handleChange}
                            placeholder="https://sua-imagem.com/thumb.jpg"
                        />
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                        <FileUpload
                            onUploadComplete={(url) => setForm(prev => ({ ...prev, thumbnailUrl: url }))}
                            label="Upload"
                        />
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setShowGallery(true)}
                        >
                            <ImageIcon size={16} /> Galeria
                        </Button>
                    </div>
                </div>
            </div>

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

            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Resumo da Estratégia</h3>
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

            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Métricas de Referência</h3>
                <div className={styles.row}>
                    <Input
                        label="CPL de Ref. (R$)"
                        name="referenceCpl"
                        type="number"
                        step="0.01"
                        value={form.referenceCpl}
                        onChange={handleChange}
                    />
                    <Input
                        label="ROAS de Ref."
                        name="referenceRoas"
                        type="number"
                        step="0.1"
                        value={form.referenceRoas}
                        onChange={handleChange}
                    />
                </div>
            </div>

            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Configurações de Exibição</h3>
                <div className={styles.checkboxGroup}>
                    <label className={styles.checkboxLabel}>
                        <input
                            type="checkbox"
                            name="featured"
                            checked={form.featured}
                            onChange={handleCheckboxChange}
                        />
                        Destaque (Aparece no topo)
                    </label>
                    <label className={styles.checkboxLabel}>
                        <input
                            type="checkbox"
                            name="scalingBadge"
                            checked={form.scalingBadge}
                            onChange={handleCheckboxChange}
                        />
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

            <div className={styles.actions}>
                <Button variant="secondary" type="button" onClick={() => router.back()} disabled={loading}>
                    <X size={16} /> Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
                    {isEditing ? 'Salvar Alterações' : 'Criar Oferta'}
                </Button>
            </div>
        </form>
    );
}
