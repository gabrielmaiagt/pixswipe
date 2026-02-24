'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Input, Textarea, Select } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Save, X, Loader2, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Module, ModuleStatus } from '@/types';
import FileUpload from './FileUpload';
import AssetManager from './AssetManager';
import styles from './OfferForm.module.css';

interface ModuleFormProps {
    initialData?: Partial<Module>;
    moduleId?: string;
    isEditing?: boolean;
}

export default function ModuleForm({ initialData, moduleId, isEditing }: ModuleFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showGallery, setShowGallery] = useState(false);

    const [form, setForm] = useState({
        title: initialData?.title || '',
        description: initialData?.description || '',
        order: initialData?.order || 0,
        status: (initialData?.status as ModuleStatus) || 'draft',
        coverUrl: initialData?.coverUrl || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'number' ? parseInt(value) : value;
        setForm((prev) => ({ ...prev, [name]: val }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const moduleData = {
                title: form.title,
                description: form.description,
                order: form.order,
                status: form.status,
                coverUrl: form.coverUrl,
                updatedAt: serverTimestamp(),
            };

            if (isEditing && moduleId) {
                await updateDoc(doc(db, 'modules', moduleId), moduleData);
                toast.success('Módulo atualizado!');
            } else {
                const newDocRef = doc(db, 'modules', moduleId || Math.random().toString(36).substring(7));
                await setDoc(newDocRef, {
                    ...moduleData,
                    createdAt: serverTimestamp(),
                });
                toast.success('Módulo criado!');
            }

            router.push('/admin/modulos');
            router.refresh();
        } catch (err) {
            console.error('Save module error:', err);
            toast.error('Erro ao salvar módulo');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.section}>
                <Input
                    label="Título do Módulo"
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
                <div className={styles.row}>
                    <Input
                        label="Ordem"
                        name="order"
                        type="number"
                        value={form.order}
                        onChange={handleChange}
                        required
                    />
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
                </div>
                <div className={styles.row} style={{ alignItems: 'flex-end', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                        <Input
                            label="URL da Capa"
                            name="coverUrl"
                            value={form.coverUrl}
                            onChange={handleChange}
                            placeholder="https://sua-imagem.com/capa.jpg"
                        />
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                        <FileUpload
                            onUploadComplete={(url) => setForm(prev => ({ ...prev, coverUrl: url }))}
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
                                setForm(prev => ({ ...prev, coverUrl: url }));
                                setShowGallery(false);
                                toast.success('Imagem selecionada');
                            }} />
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.actions}>
                <Button variant="secondary" type="button" onClick={() => router.back()} disabled={loading}>
                    <X size={16} /> Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
                    {isEditing ? 'Salvar Alterações' : 'Criar Módulo'}
                </Button>
            </div>
        </form>
    );
}
