'use client';

import { type ReactNode } from 'react';
import { Lock, ArrowUpRight } from 'lucide-react';
import Button from './Button';
import styles from './Badge.module.css';

// --- Badge Component ---
interface BadgeProps {
    variant: 'starter' | 'pro' | 'annual' | 'scaling' | 'updated' | 'active' | 'warning' | 'error';
    children: ReactNode;
    icon?: ReactNode;
}

export function Badge({ variant, children, icon }: BadgeProps) {
    return (
        <span className={`${styles.badge} ${styles[variant]}`}>
            {icon && <span className={styles.badgeIcon}>{icon}</span>}
            {children}
        </span>
    );
}

// --- Plan Badge ---
export function PlanBadge({ plan }: { plan: string }) {
    const labels: Record<string, string> = {
        starter: 'Starter',
        pro: 'Pro',
        annual: 'Anual',
    };

    return (
        <Badge variant={plan as BadgeProps['variant']}>
            {labels[plan] || plan}
        </Badge>
    );
}

// --- Upgrade CTA (shown when content is locked) ---
interface UpgradeCtaProps {
    requiredPlan: string;
    onUpgrade: () => void;
}

export function UpgradeCta({ requiredPlan, onUpgrade }: UpgradeCtaProps) {
    const planLabel = requiredPlan === 'pro' ? 'Pro' : 'Anual';

    return (
        <div className={styles.upgradeCta}>
            <Lock size={24} />
            <p>Conteúdo exclusivo do plano <strong>{planLabel}</strong></p>
            <Button
                variant="primary"
                size="sm"
                icon={<ArrowUpRight size={14} />}
                onClick={onUpgrade}
            >
                Fazer upgrade
            </Button>
        </div>
    );
}

// --- Status Badge ---
export function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { variant: BadgeProps['variant']; label: string }> = {
        active: { variant: 'active', label: 'Ativo' },
        past_due: { variant: 'warning', label: 'Inadimplente' },
        canceled: { variant: 'warning', label: 'Cancelado' },
        expired: { variant: 'error', label: 'Expirado' },
        published: { variant: 'active', label: 'Publicada' },
        draft: { variant: 'warning', label: 'Rascunho' },
        archived: { variant: 'error', label: 'Arquivada' },
    };

    const { variant, label } = config[status] || { variant: 'warning' as const, label: status };
    return <Badge variant={variant}>{label}</Badge>;
}
