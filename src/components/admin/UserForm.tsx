'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, setDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Input, Select } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Save, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { User, UserRole, PlanType, EntitlementStatus } from '@/types';
import styles from './OfferForm.module.css';

interface UserFormProps {
    initialData?: Partial<User>;
    userId?: string;
    isEditing?: boolean;
}

export default function UserForm({ initialData, userId, isEditing }: UserFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        name: initialData?.name || '',
        email: initialData?.email || '',
        password: '',
        role: (initialData?.role as UserRole) || 'user',
        plan: (initialData?.plan as PlanType) || 'starter',
        entitlementStatus: (initialData?.entitlementStatus as EntitlementStatus) || 'active',
        currentPeriodEnd: initialData?.currentPeriodEnd?.toDate
            ? initialData.currentPeriodEnd.toDate().toISOString().split('T')[0]
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isEditing && userId) {
                const userData = {
                    name: form.name,
                    email: form.email,
                    role: form.role,
                    plan: form.plan,
                    entitlementStatus: form.entitlementStatus,
                    currentPeriodEnd: Timestamp.fromDate(new Date(form.currentPeriodEnd)),
                    updatedAt: serverTimestamp(),
                };
                await updateDoc(doc(db, 'users', userId), userData);
                toast.success('Usuário atualizado com sucesso!');
            } else {
                // Use the new API route for full creation (Auth + Firestore)
                const res = await fetch('/api/admin/create-user', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(form),
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || 'Erro ao criar usuário');
                }

                toast.success('Usuário criado com sucesso no Auth e Firestore!');
            }

            router.push('/admin/usuarios');
            router.refresh();
        } catch (err: any) {
            console.error('Save user error:', err);
            toast.error(err.message || 'Erro ao salvar usuário');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Identificação</h3>
                <Input
                    label="Nome Completo"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="Ex: João Silva"
                />
                <Input
                    label="E-mail"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="usuario@email.com"
                    disabled={isEditing}
                />
                {!isEditing && (
                    <Input
                        label="Senha Inicial"
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={handleChange}
                        required
                        placeholder="Mínimo 6 caracteres"
                        hint="Esta será a senha que o usuário usará para o primeiro acesso."
                    />
                )}
            </div>

            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Permissões e Plano</h3>
                <div className={styles.row}>
                    <Select
                        label="Cargo (Role)"
                        name="role"
                        value={form.role}
                        onChange={handleChange}
                        options={[
                            { value: 'user', label: 'Usuário Comum' },
                            { value: 'admin', label: 'Administrador' },
                        ]}
                    />
                    <Select
                        label="Plano Atual"
                        name="plan"
                        value={form.plan}
                        onChange={handleChange}
                        options={[
                            { value: 'starter', label: 'Starter' },
                            { value: 'pro', label: 'Pro' },
                        ]}
                    />
                </div>
                <div className={styles.row}>
                    <Select
                        label="Status de Acesso"
                        name="entitlementStatus"
                        value={form.entitlementStatus}
                        onChange={handleChange}
                        options={[
                            { value: 'active', label: 'Ativo' },
                            { value: 'past_due', label: 'Pagamento Pendente' },
                            { value: 'expired', label: 'Expirado' },
                            { value: 'canceled', label: 'Cancelado' },
                        ]}
                    />
                    <Input
                        label="Data de Expiração"
                        name="currentPeriodEnd"
                        type="date"
                        value={form.currentPeriodEnd}
                        onChange={handleChange}
                        required
                    />
                </div>
            </div>

            <div className={styles.actions}>
                <Button variant="secondary" type="button" onClick={() => router.back()} disabled={loading}>
                    <X size={16} /> Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
                    {isEditing ? 'Salvar Alterações' : 'Criar Usuário'}
                </Button>
            </div>
        </form>
    );
}
