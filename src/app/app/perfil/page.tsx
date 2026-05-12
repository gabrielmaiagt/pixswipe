'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { User, Lock, Save, Calendar, Zap, CreditCard, X, Sparkles, Check } from 'lucide-react';
import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { changePassword } from '@/lib/auth';
import { getCheckoutUrl } from '@/lib/cakto';
import { Input } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { PlanBadge } from '@/components/ui/Badge';
import toast from 'react-hot-toast';

import styles from './perfil.module.css';

export default function PerfilPage() {
    const { firebaseUser, userData } = useAuth();
    const [name, setName] = useState(userData?.name || '');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [saving, setSaving] = useState(false);
    const [changingPw, setChangingPw] = useState(false);
    const [settings, setSettings] = useState<any>(null);
    const [showPlanModal, setShowPlanModal] = useState(false);

    useEffect(() => {
        if (userData) {
            setName(userData.name || '');
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
        <div className={styles.perfilContainer}>
            <h1 className={styles.title}>Meu Perfil</h1>

            <div className={styles.profileGrid}>
                <div className={styles.formsColumn}>
                    <form onSubmit={handleSaveProfile} className={styles.formCard}>
                        <h3 className={styles.sectionHeader}>
                            <User size={18} /> Dados pessoais
                        </h3>
                        <div className={styles.formContent}>
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

                    <form onSubmit={handleChangePassword} className={styles.formCard}>
                        <h3 className={styles.sectionHeader}>
                            <Lock size={18} /> Alterar senha
                        </h3>
                        <div className={styles.formContent}>
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

                <div className={styles.sidebarColumn}>
                    <div className={styles.subscriptionCard}>
                        <div className={styles.cardGlow} />
                        <h3 className={styles.subscriptionLabel}>Assinatura ATIVA</h3>
                        <div style={{ marginBottom: 20 }}>
                            <PlanBadge plan={userData?.plan || 'starter'} />
                        </div>
                        {daysRemaining !== null && (
                            <div className={styles.daysLeftContainer}>
                                <div className={styles.daysLeftValue}>
                                    <Calendar size={18} style={{ color: 'var(--brand-primary)' }} />
                                    {daysRemaining} dias restantes
                                </div>
                                <div className={styles.expirationDate}>
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

                    <div className={styles.metricsCard}>
                        <h3 style={{ fontSize: 'var(--font-md)', fontWeight: 700, marginBottom: 20 }}>Sua Jornada</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div className={styles.metricRow}>
                                <span className={styles.metricLabel}>Ofertas Vistas</span>
                                <span className={styles.metricValue}>{userData?.metrics?.offersViewed || 0}</span>
                            </div>
                            <div className={styles.metricRow}>
                                <span className={styles.metricLabel}>Aulas Feitas</span>
                                <span style={{ fontWeight: 700, color: 'var(--brand-secondary)' }}>{userData?.metrics?.lessonsDone || 0}</span>
                            </div>
                            <div className={styles.memberSince}>
                                <div className={styles.memberSinceLabel}>MEMBRO DESDE</div>
                                <div className={styles.memberSinceValue}>
                                    {userData?.createdAt ? new Date(userData.createdAt.seconds * 1000).toLocaleDateString('pt-BR') : 'Recém-chegado'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showPlanModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <button onClick={() => setShowPlanModal(false)} className={styles.modalClose}>
                            <X size={24} />
                        </button>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>Gerenciar Plano</h2>
                            <p className={styles.modalSubtitle}>Escolha o plano ideal para continuar sua jornada.</p>
                        </div>

                        <div className={styles.plansGrid}>
                            {[
                                {
                                    id: 'starter',
                                    name: 'Starter',
                                    price: '97',
                                    icon: <CreditCard />,
                                    subtitle: 'Para iniciantes, no x1 automático.',
                                    features: ['Ofertas de X1 validadas', 'Criativos escalados', 'Funis prontos', 'Aulas Exclusivas De X1']
                                },
                                {
                                    id: 'pro',
                                    name: 'Pro',
                                    price: '127',
                                    icon: <Zap />,
                                    featured: true,
                                    subtitle: 'Para quem quer tráfego direto.',
                                    features: ['Tudo do Starter', 'Ofertas Tráfego Direto', 'Ofertas White/Black/Hot', 'Suporte prioritário']
                                },
                                {
                                    id: 'elite',
                                    name: 'Elite',
                                    price: '147',
                                    icon: <Sparkles />,
                                    subtitle: 'Para escalar em dólar globalmente.',
                                    features: ['Tudo do Pro/Starter', 'Ofertas Latam (Global)', 'Ofertas de Micro SAAS', 'Networking VIP']
                                },
                            ].map((plan) => (
                                <div key={plan.id} className={`${styles.planCard} ${plan.featured ? styles.planCardFeatured : ''}`}>
                                    {plan.featured && <div className={styles.featuredLabel}>RECOMENDADO</div>}
                                    <div className={styles.planIcon} style={{ color: plan.id === 'pro' ? 'var(--brand-primary)' : plan.id === 'elite' ? 'var(--accent-orange)' : 'var(--text-tertiary)' }}>
                                        {plan.icon}
                                    </div>
                                    <h4 className={styles.planName}>{plan.name}</h4>
                                    <p className={styles.planSubtitle}>{plan.subtitle}</p>
                                    <div className={styles.planPrice}>
                                        R${plan.price}
                                        <span className={styles.pricePeriod}>/mês</span>
                                    </div>
                                    <div className={styles.featuresList}>
                                        {plan.features.map(f => (
                                            <div key={f} className={styles.featureItem}>
                                                <Check size={12} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
                                                <span className={styles.featureText}>{f}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <Button
                                        variant={userData?.plan === plan.id ? 'secondary' : plan.featured ? 'primary' : 'ghost'}
                                        size="sm"
                                        fullWidth
                                        disabled={userData?.plan === plan.id}
                                        onClick={() => handlePlanAction(plan.id)}
                                        style={{ marginTop: 'auto' }}
                                    >
                                        {userData?.plan === plan.id ? 'Atual' : 'Assinar'}
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
