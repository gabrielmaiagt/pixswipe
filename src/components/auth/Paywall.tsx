'use client';

import { Lock, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { signOut } from '@/lib/auth';
import styles from './Paywall.module.css';

interface PaywallProps {
    status: string;
}

export default function Paywall({ status }: PaywallProps) {
    const router = useRouter();
    const isPastDue = status === 'past_due';

    async function handleSwitchAccount() {
        await signOut();
        router.push('/login');
    }

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
                    <button
                        onClick={handleSwitchAccount}
                        style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', marginTop: '8px', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                        Entrar com outra conta
                    </button>
                </div>
            </div>
        </div>
    );
}
