'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { User, Lock, Save, Calendar, Zap, CreditCard, X } from 'lucide-react';
import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { changePassword } from '@/lib/auth';
import { getCheckoutUrl } from '@/lib/cakto';
import { Input } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { PlanBadge } from '@/components/ui/Badge';
import toast from 'react-hot-toast';

export default function PerfilPage() {
    const { firebaseUser, userData } = useAuth();
    const [name, setName] = useState(userData?.name || '');
    const [affiliateCode, setAffiliateCode] = useState(userData?.affiliateCode || '');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [saving, setSaving] = useState(false);
    const [changingPw, setChangingPw] = useState(false);
    const [settings, setSettings] = useState<any>(null);
    const [showPlanModal, setShowPlanModal] = useState(false);

    useEffect(() => {
        if (userData) {
            setName(userData.name || '');
            setAffiliateCode(userData.affiliateCode || '');
        }
    }, [userData]);

    useEffect(() => {
        async function fetchSettings() {
            try {
                const snap = await getDoc(doc(db, 'settings', 'general'));
                if (snap.exists()) {
                    setSettings(snap.data());
                }
            } catch (err) {
                console.error('Error fetching settings:', err);
            }
        }
        fetchSettings();
    }, []);

    const daysRemaining = (() => {
        if (!userData?.currentPeriodEnd) return null;
        // Handle both Firestore Timestamp and JS Date
        const end = typeof (userData.currentPeriodEnd as any).toDate === 'function'
            ? (userData.currentPeriodEnd as any).toDate()
            : new Date(userData.currentPeriodEnd as any);

        const now = new Date();
        const diff = end.getTime() - now.getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return days > 0 ? days : 0;
    })();

    async function handleSaveProfile(e: FormEvent) {
        e.preventDefault();
        if (!firebaseUser) return;
        setSaving(true);
        try {
            await updateDoc(doc(db, 'users', firebaseUser.uid), {
                name,
                affiliateCode: affiliateCode.trim().toUpperCase(),
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

    const handlePlanAction = (planId: string) => {
        if (userData?.plan === planId) {
            toast('Você já possui este plano ativo.', { icon: 'ℹ️' });
            return;
        }
        try {
            const url = getCheckoutUrl(planId as any, null, userData?.email || '', settings);
            window.location.href = url;
        } catch (err) {
            console.error('Checkout error:', err);
            toast.error('Link de checkout não configurado.');
        }
    };

    return (
        <div style={{ maxWidth: 800 }}>
            <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, marginBottom: 24 }}>
                Meu Perfil
            </h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 24, alignItems: 'start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Profile form */}
                    <form onSubmit={handleSaveProfile} style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-secondary)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 24,
                    }}>
                        <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
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

                            <Input
                                label="Meu Código de Afiliado (Cakto)"
                                value={affiliateCode}
                                onChange={(e) => setAffiliateCode(e.target.value)}
                                placeholder="Ex: ABC123XYZ"
                                hint="Cole aqui o código que você pegou na Cakto para ativar seu link."
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
                    }}>
                        <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
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
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Subscription Sidebar Card */}
                    <div style={{
                        background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-elevated) 100%)',
                        border: '1px solid var(--border-secondary)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 24,
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            position: 'absolute',
                            top: -20,
                            right: -20,
                            width: 100,
                            height: 100,
                            background: 'var(--brand-primary)',
                            opacity: 0.05,
                            borderRadius: '50%'
                        }} />

                        <h3 style={{ fontSize: 'var(--font-md)', fontWeight: 700, marginBottom: 16, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Assinatura ATIVA
                        </h3>

                        <div style={{ marginBottom: 20 }}>
                            <PlanBadge plan={userData?.plan || 'starter'} />
                        </div>

                        {daysRemaining !== null && (
                            <div style={{ marginBottom: 24 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)', fontWeight: 700, fontSize: 'var(--font-lg)' }}>
                                    <Calendar size={18} style={{ color: 'var(--brand-primary)' }} />
                                    {daysRemaining} dias restantes
                                </div>
                                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', marginTop: 4 }}>
                                    Expira em {userData?.currentPeriodEnd && typeof (userData.currentPeriodEnd as any).toDate === 'function'
                                        ? (userData.currentPeriodEnd as any).toDate().toLocaleDateString('pt-BR')
                                        : userData?.currentPeriodEnd
                                            ? new Date(userData.currentPeriodEnd as any).toLocaleDateString('pt-BR')
                                            : '-'}
                                </div>
                            </div>
                        )}

                        <Button
                            variant="primary"
                            fullWidth
                            icon={<Zap size={16} />}
                            onClick={() => setShowPlanModal(true)}
                        >
                            Gerenciar Assinatura
                        </Button>
                    </div>

                    {/* Simple Journey Metrics */}
                    <div style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-secondary)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 24,
                    }}>
                        <h3 style={{ fontSize: 'var(--font-md)', fontWeight: 700, marginBottom: 20 }}>Sua Jornada</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>Ofertas Vistas</span>
                                <span style={{ fontWeight: 700, color: 'var(--brand-primary)' }}>{userData?.metrics?.offersViewed || 0}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>Aulas Feitas</span>
                                <span style={{ fontWeight: 700, color: 'var(--brand-secondary)' }}>{userData?.metrics?.lessonsDone || 0}</span>
                            </div>
                            <div style={{ borderTop: '1px solid var(--border-secondary)', paddingTop: 12, marginTop: 4 }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: 4 }}>MEMBRO DESDE</div>
                                <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>
                                    {userData?.createdAt ? new Date(userData.createdAt.seconds * 1000).toLocaleDateString('pt-BR') : 'Recém-chegado'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Plan Management Modal */}
            {showPlanModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: 20
                }}>
                    <div style={{
                        background: 'var(--bg-card)',
                        width: '100%',
                        maxWidth: 700,
                        borderRadius: 24,
                        padding: 32,
                        position: 'relative',
                        border: '1px solid var(--border-secondary)'
                    }}>
                        <button
                            onClick={() => setShowPlanModal(false)}
                            style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}
                        >
                            <X size={24} />
                        </button>

                        <div style={{ textAlign: 'center', marginBottom: 32 }}>
                            <h2 style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, marginBottom: 8 }}>Gerenciar Plano</h2>
                            <p style={{ color: 'var(--text-secondary)' }}>Escolha o plano ideal para continuar sua jornada.</p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, maxWidth: 500, margin: '0 auto' }}>
                            {[
                                { id: 'starter', name: 'Starter', price: '67', icon: <CreditCard /> },
                                { id: 'pro', name: 'Pro', price: '97', icon: <Zap />, featured: true },
                            ].map((plan) => (
                                <div key={plan.id} style={{
                                    background: plan.featured ? 'var(--bg-elevated)' : 'transparent',
                                    border: plan.featured ? '2px solid var(--brand-primary)' : '1px solid var(--border-secondary)',
                                    borderRadius: 20,
                                    padding: 24,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    textAlign: 'center',
                                    transition: 'all 0.2s ease',
                                    position: 'relative'
                                }}>
                                    {plan.featured && (
                                        <div style={{
                                            position: 'absolute',
                                            top: -12,
                                            background: 'var(--brand-primary)',
                                            color: '#000',
                                            fontSize: '10px',
                                            fontWeight: 800,
                                            padding: '4px 12px',
                                            borderRadius: 20
                                        }}>
                                            RECOMENDADO
                                        </div>
                                    )}
                                    <div style={{ color: plan.id === 'pro' ? 'var(--brand-primary)' : 'var(--text-tertiary)', marginBottom: 12 }}>
                                        {plan.icon}
                                    </div>
                                    <h4 style={{ fontWeight: 700, fontSize: 'var(--font-lg)', marginBottom: 8 }}>{plan.name}</h4>
                                    <div style={{ fontSize: 'var(--font-xl)', fontWeight: 800, marginBottom: 20 }}>
                                        R${plan.price}
                                        <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', fontWeight: 400 }}>/mês</span>
                                    </div>

                                    <Button
                                        variant={userData?.plan === plan.id ? 'secondary' : plan.featured ? 'primary' : 'ghost'}
                                        size="sm"
                                        fullWidth
                                        disabled={userData?.plan === plan.id}
                                        onClick={() => handlePlanAction(plan.id)}
                                    >
                                        {userData?.plan === plan.id ? 'Plano Atual' : 'Selecionar'}
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <div style={{ marginTop: 32, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--font-xs)' }}>
                            Upgrade imediato. Downsell entra em vigor no próximo ciclo de faturamento.
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
