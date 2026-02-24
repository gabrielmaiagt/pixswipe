'use client';

import { CheckCircle, Zap, ArrowRight, PlayCircle } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function SuccessPage() {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifySelf: 'center', minHeight: '80vh', textAlign: 'center', padding: 24 }}>
            <div style={{ maxWidth: 500, margin: '0 auto', background: 'var(--bg-card)', padding: '48px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-secondary)' }}>
                <div style={{ display: 'inline-flex', padding: 24, background: 'rgba(0, 212, 170, 0.1)', borderRadius: 99, color: 'var(--brand-primary)', marginBottom: 32 }}>
                    <CheckCircle size={64} />
                </div>
                <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, marginBottom: 16 }}>Assinatura Confirmada!</h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 40, lineHeight: 1.6 }}>
                    Seu pagamento foi processado com sucesso. Bem-vindo(a) ao time de elite do Pix Swipe!
                    Explore agora as ofertas validadas.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <Link href="/app/ofertas">
                        <Button fullWidth size="lg" icon={<Zap size={18} />}>Explorar Ofertas</Button>
                    </Link>
                    <Link href="/app/aulas">
                        <Button fullWidth variant="ghost" icon={<PlayCircle size={18} />}>Ver Treinamentos</Button>
                    </Link>
                </div>

                <div style={{ marginTop: 32 }}>
                    <Link href="/app" style={{ color: 'var(--brand-primary)', fontSize: 'var(--font-sm)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        Ir para o Dashboard <ArrowRight size={14} />
                    </Link>
                </div>
            </div>
        </div>
    );
}
