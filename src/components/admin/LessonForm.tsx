'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, setDoc, updateDoc, serverTimestamp, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Input, Textarea, Select } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Save, X, Loader2, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Lesson, LessonStatus, PlanType, Module } from '@/types';
import FileUpload from './FileUpload';
import AssetManager from './AssetManager';
import styles from './OfferForm.module.css';

interface LessonFormProps {
    initialData?: Partial<Lesson>;
    lessonId?: string;
    isEditing?: boolean;
}

export default function LessonForm({ initialData, lessonId, isEditing }: LessonFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [modules, setModules] = useState<Module[]>([]);
    const [showGallery, setShowGallery] = useState<{ show: boolean, target: 'video' | 'thumb' }>({
        show: false,
        target: 'video'
    });

    const [form, setForm] = useState({
        title: initialData?.title || '',
        description: initialData?.description || '',
        videoUrl: initialData?.videoUrl || '',
        thumbnailUrl: initialData?.thumbnailUrl || '',
        duration: initialData?.duration || 0,
        order: initialData?.order || 0,
        moduleId: initialData?.moduleId || '',
        status: (initialData?.status as LessonStatus) || 'draft',
        availableOnPlans: initialData?.availableOnPlans || ['starter', 'pro', 'annual'],
    });

    useEffect(() => {
        async function fetchModules() {
            const snap = await getDocs(query(collection(db, 'modules'), orderBy('order', 'asc')));
            setModules(snap.docs.map(d => ({ id: d.id, ...d.data() } as Module)));
        }
        fetchModules();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'number' ? parseInt(value) : value;
        setForm((prev) => ({ ...prev, [name]: val }));
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
        if (!form.moduleId) {
            toast.error('Selecione um módulo');
            return;
        }
        setLoading(true);

        try {
            const lessonData = {
                title: form.title,
                description: form.description,
                videoUrl: form.videoUrl,
                thumbnailUrl: form.thumbnailUrl,
                duration: form.duration,
                order: form.order,
                moduleId: form.moduleId,
                status: form.status,
                availableOnPlans: form.availableOnPlans,
                updatedAt: serverTimestamp(),
            };

            if (isEditing && lessonId) {
                await updateDoc(doc(db, 'lessons', lessonId), lessonData);
                toast.success('Aula atualizada!');
            } else {
                const newDocRef = doc(db, 'lessons', lessonId || Math.random().toString(36).substring(7));
                await setDoc(newDocRef, {
                    ...lessonData,
                    createdAt: serverTimestamp(),
                });
                toast.success('Aula criada!');
            }

            router.push('/admin/aulas');
            router.refresh();
        } catch (err) {
            console.error('Save lesson error:', err);
            toast.error('Erro ao salvar aula');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.section}>
                <Input
                    label="Título da Aula"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    required
                />
                <Textarea
                    label="Descrição"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                />
                <Select
                    label="Módulo"
                    name="moduleId"
                    value={form.moduleId}
                    onChange={handleChange}
                    required
                    options={[
                        { value: '', label: 'Selecione um módulo...' },
                        ...modules.map(m => ({ value: m.id, label: m.title }))
                    ]}
                />
                <div className={styles.row}>
                    <Input
                        label="Duração (segundos)"
                        name="duration"
                        type="number"
                        value={form.duration}
                        onChange={handleChange}
                        required
                    />
                    <Input
                        label="Ordem"
                        name="order"
                        type="number"
                        value={form.order}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className={styles.row} style={{ alignItems: 'flex-end', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                        <Input
                            label="URL do Vídeo (Panda/Vimeo/Youtube/Direct)"
                            name="videoUrl"
                            value={form.videoUrl}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                        <FileUpload
                            onUploadComplete={(url) => setForm(prev => ({ ...prev, videoUrl: url }))}
                            label="Upload"
                            accept="video/*"
                        />
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setShowGallery({ show: true, target: 'video' })}
                        >
                            <ImageIcon size={16} /> Galeria
                        </Button>
                    </div>
                </div>

                <div className={styles.row} style={{ alignItems: 'flex-end', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                        <Input
                            label="Thumbnail URL"
                            name="thumbnailUrl"
                            value={form.thumbnailUrl}
                            onChange={handleChange}
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
                            onClick={() => setShowGallery({ show: true, target: 'thumb' })}
                        >
                            <ImageIcon size={16} /> Galeria
                        </Button>
                    </div>
                </div>
            </div>

            {showGallery.show && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h3>Selecionar Asset ({showGallery.target === 'video' ? 'Vídeo' : 'Thumbnail'})</h3>
                            <button className={styles.closeBtn} onClick={() => setShowGallery({ ...showGallery, show: false })}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <AssetManager onSelect={(url) => {
                                setForm(prev => ({
                                    ...prev,
                                    [showGallery.target === 'video' ? 'videoUrl' : 'thumbnailUrl']: url
                                }));
                                setShowGallery({ ...showGallery, show: false });
                                toast.success('Selecionado');
                            }} />
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Configurações de Acesso</h3>
                <Select
                    label="Status"
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    options={[
                        { value: 'draft', label: 'Rascunho' },
                        { value: 'published', label: 'Publicado' },
                    ]}
                />
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
            </div>

            <div className={styles.actions}>
                <Button variant="secondary" type="button" onClick={() => router.back()} disabled={loading}>
                    <X size={16} /> Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
                    {isEditing ? 'Salvar Alterações' : 'Criar Aula'}
                </Button>
            </div>
        </form>
    );
}
