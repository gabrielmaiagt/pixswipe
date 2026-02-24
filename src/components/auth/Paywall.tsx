'use client';

import { Lock, CreditCard } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import styles from './Paywall.module.css';

interface PaywallProps {
    status: string;
}

export default function Paywall({ status }: PaywallProps) {
    const isPastDue = status === 'past_due';
    const isExpired = status === 'expired' || status === 'canceled';

    return (
        <div className={styles.paywallOverlay}>
            <div className={styles.paywallCard}>
                <div className={styles.paywallIcon}>
                    <Lock size={32} />
                </div>
                <h2>Acesso Bloqueado</h2>
                <p>
                    {isPastDue
                        ? 'Seu último pagamento falhou. Por favor, regularize sua assinatura para continuar acessando as ofertas.'
                        : 'Sua assinatura expirou ou foi cancelada. Assine um de nossos planos para ter acesso a toda a biblioteca.'
                    }
                </p>
                <div className={styles.paywallActions}>
                    <Link href="/#precos">
                        <Button fullWidth icon={<CreditCard size={18} />}>
                            {isPastDue ? 'Regularizar Assinatura' : 'Ver Planos e Assinar'}
                        </Button>
                    </Link>
                    <Link href="/login" style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', marginTop: '8px' }}>
                        Entrar com outra conta
                    </Link>
                </div>
            </div>
        </div>
    );
}
