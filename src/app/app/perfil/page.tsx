'use client';

import { useState, type FormEvent } from 'react';
import { User, Mail, Lock, Save } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { changePassword } from '@/lib/auth';
import { Input } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { PlanBadge } from '@/components/ui/Badge';
import toast from 'react-hot-toast';

export default function PerfilPage() {
    const { firebaseUser, userData } = useAuth();
    const [name, setName] = useState(userData?.name || '');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [saving, setSaving] = useState(false);
    const [changingPw, setChangingPw] = useState(false);

    async function handleSaveProfile(e: FormEvent) {
        e.preventDefault();
        if (!firebaseUser) return;
        setSaving(true);
        try {
            await updateDoc(doc(db, 'users', firebaseUser.uid), {
                name,
                updatedAt: serverTimestamp(),
            });
            toast.success('Perfil atualizado!');
        } catch {
            toast.error('Erro ao atualizar');
        } finally {
            setSaving(false);
        }
    }

    async function handleChangePassword(e: FormEvent) {
        e.preventDefault();
        if (newPassword.length < 6) {
            toast.error('A senha deve ter pelo menos 6 caracteres.');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('As senhas não coincidem.');
            return;
        }
        setChangingPw(true);
        try {
            await changePassword(newPassword);
            setNewPassword('');
            setConfirmPassword('');
            toast.success('Senha alterada com sucesso!');
        } catch {
            toast.error('Erro ao alterar senha. Faça login novamente e tente.');
        } finally {
            setChangingPw(false);
        }
    }

    return (
        <div style={{ maxWidth: 600 }}>
            <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, marginBottom: 24 }}>
                Perfil
            </h1>

            {/* Plan info */}
            {userData?.plan && (
                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-secondary)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 20,
                    marginBottom: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <div>
                        <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-tertiary)', marginBottom: 4 }}>
                            Seu plano
                        </div>
                        <PlanBadge plan={userData.plan} />
                    </div>
                    <Button variant="secondary" size="sm">
                        Gerenciar assinatura
                    </Button>
                </div>
            )}

            {/* Profile form */}
            <form onSubmit={handleSaveProfile} style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-secondary)',
                borderRadius: 'var(--radius-lg)',
                padding: 24,
                marginBottom: 24,
            }}>
                <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, marginBottom: 16 }}>
                    <User size={18} /> Dados pessoais
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <Input
                        label="Nome completo"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />

                    <Input
                        label="E-mail"
                        value={firebaseUser?.email || ''}
                        disabled
                        hint="O e-mail não pode ser alterado"
                    />

                    <Button type="submit" loading={saving} icon={<Save size={14} />}>
                        Salvar alterações
                    </Button>
                </div>
            </form>

            {/* Password form */}
            <form onSubmit={handleChangePassword} style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-secondary)',
                borderRadius: 'var(--radius-lg)',
                padding: 24,
                marginBottom: 24,
            }}>
                <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, marginBottom: 16 }}>
                    <Lock size={18} /> Alterar senha
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <Input
                        label="Nova senha"
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                    />

                    <Input
                        label="Confirmar nova senha"
                        type="password"
                        placeholder="Repita a nova senha"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />

                    <Button type="submit" variant="secondary" loading={changingPw} icon={<Lock size={14} />}>
                        Alterar senha
                    </Button>
                </div>
            </form>

            {/* Usage Metrics */}
            <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-secondary)',
                borderRadius: 'var(--radius-lg)',
                padding: 24,
            }}>
                <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, marginBottom: 20 }}>
                    <Save size={18} /> Sua Jornada
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                    <div style={{ padding: 16, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                        <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, color: 'var(--brand-primary)' }}>
                            {userData?.metrics?.offersViewed || 0}
                        </div>
                        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: 4 }}>
                            Ofertas Vistas
                        </div>
                    </div>
                    <div style={{ padding: 16, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                        <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, color: 'var(--brand-secondary)' }}>
                            {userData?.metrics?.lessonsDone || 0}
                        </div>
                        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: 4 }}>
                            Aulas Feitas
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Foco Principal:</span>
                        <span style={{ fontWeight: 600 }}>{userData?.onboarding?.niches?.join(', ') || 'Não definido'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Membro desde:</span>
                        <span style={{ fontWeight: 600 }}>
                            {userData?.createdAt ? new Date(userData.createdAt.seconds * 1000).toLocaleDateString('pt-BR') : 'Recém-chegado'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
