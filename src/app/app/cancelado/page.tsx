'use client';

import { XCircle, ArrowLeft, Headphones } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function CancelPage() {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifySelf: 'center', minHeight: '80vh', textAlign: 'center', padding: 24 }}>
            <div style={{ maxWidth: 500, margin: '0 auto', background: 'var(--bg-card)', padding: '48px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-secondary)' }}>
                <div style={{ display: 'inline-flex', padding: 24, background: 'rgba(255, 107, 107, 0.1)', borderRadius: 99, color: '#ff6b6b', marginBottom: 32 }}>
                    <XCircle size={64} />
                </div>
                <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, marginBottom: 16 }}>Compra não finalizada</h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 40, lineHeight: 1.6 }}>
                    Parece que você desistiu do pagamento ou houve algum problema no checkout da Cakto.
                    Se precisar de ajuda para finalizar sua assinatura, conte com nosso suporte.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <Link href="/#precos">
                        <Button fullWidth size="lg">Tentar Novamente</Button>
                    </Link>
                    <Link href="/app/suporte">
                        <Button fullWidth variant="secondary" icon={<Headphones size={18} />}>Falar com Suporte</Button>
                    </Link>
                </div>

                <div style={{ marginTop: 32 }}>
                    <Link href="/app" style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-sm)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <ArrowLeft size={14} /> Voltar ao Painel
                    </Link>
                </div>
            </div>
        </div>
    );
}
