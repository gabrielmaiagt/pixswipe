'use client';

import { useState } from 'react';
import {
    Headphones,
    MessageCircle,
    Send,
    HelpCircle,
    ChevronRight,
    CheckCircle2
} from 'lucide-react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import styles from '@/app/app/suporte/suporte.module.css';

const FAQS = [
    {
        q: 'Como encontro as ofertas mais lucrativas?',
        a: 'No dashboard de Ofertas, utilize o filtro de status "Escalando" para ver os produtos que estão performando melhor no momento.'
    },
    {
        q: 'Como integrar o funil no meu WhatsApp?',
        a: 'Cada oferta possui uma aba "Funil WhatsApp". Basta copiar as mensagens em ordem e enviá-las conforme o delay sugerido.'
    },
    {
        q: 'Posso usar os criativos em qualquer plataforma?',
        a: 'Sim, nossos criativos são validados para Facebook Ads, Instagram e TikTok, focando sempre em conversão direta para X1.'
    },
    {
        q: 'Como recebo minhas comissões de afiliado?',
        a: 'As comissões são processadas automaticamente via Cakto e pagas conforme o prazo do gateway (geralmente D+30 ou D+2).'
    }
];

export default function SupportPage() {
    const { userData } = useAuth();
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!subject || !message) return;

        setLoading(true);
        try {
            await addDoc(collection(db, 'supportTickets'), {
                userId: userData?.uid,
                subject,
                message,
                status: 'open',
                createdAt: Timestamp.now(),
            });
            toast.success('Ticket enviado com sucesso! Responderemos em breve.');
            setSent(true);
        } catch (err) {
            console.error('Error sending support ticket:', err);
            toast.error('Erro ao enviar ticket. Tente novamente.');
        } finally {
            setLoading(false);
        }
    }

    if (sent) {
        return (
            <div className={styles.supportContainer}>
                <div className={styles.supportHeader} style={{ marginTop: '100px' }}>
                    <div style={{ display: 'inline-flex', padding: 20, background: 'rgba(0, 212, 170, 0.1)', borderRadius: 99, color: 'var(--brand-primary)', marginBottom: 24 }}>
                        <CheckCircle2 size={48} />
                    </div>
                    <h1>Recebemos seu contato!</h1>
                    <p>Nossa equipe de suporte analisará sua solicitação e responderá por e-mail em até 24 horas úteis.</p>
                    <div style={{ marginTop: 32 }}>
                        <Button onClick={() => setSent(false)}>Abrir outro ticket</Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.supportContainer}>
            <header className={styles.supportHeader}>
                <h1>Como podemos ajudar?</h1>
                <p>Confira as dúvidas frequentes ou abra um chamado técnico.</p>
            </header>

            <div className={styles.supportGrid}>
                <section className={styles.ticketSection}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                        <MessageCircle className="text-brand-primary" size={24} />
                        <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 700 }}>Abrir Chamado</h2>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className={styles.formGroup}>
                            <label>Assunto</label>
                            <Input
                                placeholder="Do que se trata sua dúvida?"
                                value={subject}
                                onChange={e => setSubject(e.target.value)}
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Mensagem Detalhada</label>
                            <textarea
                                className="w-full bg-bg-elevated border border-border-secondary rounded-lg p-3 text-sm focus:border-brand-primary outline-none min-h-[150px]"
                                placeholder="Explique com detalhes para que possamos ajudar da melhor forma..."
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                required
                            />
                        </div>
                        <Button fullWidth loading={loading} icon={<Send size={18} />}>
                            Enviar Solicitação
                        </Button>
                    </form>

                    <div style={{ marginTop: 40, paddingTop: 40, borderTop: '1px solid var(--border-secondary)' }}>
                        <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', textAlign: 'center' }}>
                            Prefere contato direto? Chame no WhatsApp oficial:
                        </p>
                        <div style={{ marginTop: 16 }}>
                            <Button fullWidth variant="secondary" icon={<MessageCircle size={18} />}>
                                Falar com Suporte VIP (WhatsApp)
                            </Button>
                        </div>
                    </div>
                </section>

                <aside className={styles.faqSection}>
                    <div className={styles.faqGroup}>
                        <h3>Dúvidas Frequentes</h3>
                        {FAQS.map((faq, i) => (
                            <div key={i} className={styles.faqItem}>
                                <h4>{faq.q}</h4>
                                <p>{faq.a}</p>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: 'auto', padding: 20, background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-secondary)' }}>
                        <HelpCircle size={32} className="text-brand-primary mb-3" />
                        <h4 style={{ fontWeight: 700, marginBottom: 8 }}>Base de Conhecimento</h4>
                        <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                            Acesse nossos tutoriais em vídeo para dominar a ferramenta.
                        </p>
                        <Button variant="ghost" size="sm" fullWidth className="mt-4" icon={<ChevronRight size={14} />}>
                            Acessar Aulas
                        </Button>
                    </div>
                </aside>
            </div>
        </div>
    );
}
