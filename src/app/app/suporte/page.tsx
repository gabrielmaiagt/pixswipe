'use client';

import { useState, useEffect } from 'react';
import {
    Headphones,
    MessageCircle,
    Send,
    HelpCircle,
    ChevronRight,
    CheckCircle2,
    Calendar,
    Mail,
    User,
    ArrowRight
} from 'lucide-react';
import { collection, addDoc, Timestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '@/app/app/suporte/suporte.module.css';

const FAQS = [
    {
        q: 'Como encontro as ofertas mais lucrativas?',
        a: 'Acesse o painel de métricas e filtre por ROI acumulado nos últimos 30 dias.'
    },
    {
        q: 'Como integrar o funil no meu WhatsApp?',
        a: 'No menu configurações, selecione Integrações > WhatsApp e escaneie o QR Code.'
    },
    {
        q: 'Posso usar os criativos em qualquer plataforma?',
        a: 'Sim, nossos criativos são otimizados para Meta Ads, Google Ads e TikTok Ads.'
    },
    {
        q: 'Como recebo minhas comissões?',
        a: 'Os saques são processados via PIX em até 24 horas após a solicitação no painel.'
    }
];

export default function SupportPage() {
    const { userData, firebaseUser } = useAuth();
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [supportWhatsapp, setSupportWhatsapp] = useState('');

    useEffect(() => {
        async function fetchSettings() {
            try {
                const snap = await getDoc(doc(db, 'settings', 'general'));
                if (snap.exists()) {
                    setSupportWhatsapp(snap.data().supportWhatsapp || '');
                }
            } catch (err) {
                console.error('Error fetching support settings:', err);
            }
        }
        fetchSettings();
    }, []);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!subject || !message) return;

        setLoading(true);
        try {
            await addDoc(collection(db, 'supportTickets'), {
                userId: firebaseUser?.uid,
                userName: userData?.name || 'Usuário',
                userEmail: userData?.email || firebaseUser?.email || '',
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

    const openWhatsapp = () => {
        if (!supportWhatsapp) {
            toast.error('Suporte via WhatsApp indisponível no momento.');
            return;
        }
        const text = encodeURIComponent(`Olá Suporte Pix Swipe! Preciso de ajuda. Me chamo ${userData?.name || 'Usuário'}.`);
        window.open(`https://wa.me/${supportWhatsapp}?text=${text}`, '_blank');
    };

    if (sent) {
        return (
            <div className={styles.supportContainer}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={styles.successWrapper}
                >
                    <div className={styles.successIcon}>
                        <CheckCircle2 size={40} />
                    </div>
                    <h1>Recebemos seu contato!</h1>
                    <p>Nossa equipe de suporte analisará sua solicitação e responderá por e-mail em até 24 horas úteis.</p>
                    <div className={styles.successActions}>
                        <Button fullWidth onClick={() => {
                            setSent(false);
                            setSubject('');
                            setMessage('');
                        }}>Abrir outro chamado</Button>
                        <Button fullWidth variant="ghost" onClick={() => window.location.href = '/app'}>Voltar ao Início</Button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className={styles.supportContainer}>
            <header className={styles.supportHeader}>
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <span className={styles.labelBadge}>Atendimento Prioritário</span>
                    <h1>Como podemos ajudar?</h1>
                    <p>Confira as dúvidas frequentes ou abra um chamado técnico diretamente com nosso time. Nosso compromisso é o seu sucesso.</p>
                </motion.div>
            </header>

            <div className={styles.supportGrid}>
                {/* Main Form Column */}
                <motion.section
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={styles.ticketSection}
                >
                    <div className={styles.sectionTitle}>
                        <div className={styles.titleIcon}>
                            <MessageCircle size={24} />
                        </div>
                        <div className={styles.titleText}>
                            <h2>Abrir Chamado</h2>
                            <div className={styles.statusIndicator}>
                                <div className={styles.pulseDot}></div>
                                <span>Tempo de resposta: <strong>até 24h úteis</strong></span>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.supportForm}>
                        <div className={styles.formGroup}>
                            <label>Assunto do Atendimento</label>
                            <select
                                className={styles.supportTextarea}
                                style={{ minHeight: 'auto', padding: '12px 16px' }}
                                value={subject}
                                onChange={e => setSubject(e.target.value)}
                                required
                            >
                                <option value="" disabled>Dúvida sobre pagamentos, técnica, etc...</option>
                                <option value="pagamentos">Pagamentos e Assinaturas</option>
                                <option value="tecnico">Problemas Técnicos</option>
                                <option value="afiliado">Sistema de Afiliados</option>
                                <option value="outro">Outros Assuntos</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Mensagem Detalhada</label>
                            <textarea
                                className={styles.supportTextarea}
                                placeholder="Explique com detalhes para que possamos ajudar da melhor forma possível..."
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                required
                            />
                        </div>
                        <Button fullWidth loading={loading} icon={<Send size={18} />}>
                            Enviar Solicitação ao Time
                        </Button>
                    </form>

                    <div className={styles.whatsappDivider}>
                        <span>OU</span>
                    </div>

                    <div className={styles.directContact}>
                        <p>Precisa de ajuda imediata?</p>
                        <Button
                            fullWidth
                            variant="secondary"
                            className={styles.whatsappBtn}
                            onClick={openWhatsapp}
                        >
                            <MessageCircle size={18} style={{ color: '#25D366' }} /> Falar no WhatsApp Oficial
                        </Button>
                    </div>
                </motion.section>

                {/* Sidebar Column */}
                <aside className={styles.sidebarColumn}>
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className={styles.faqCard}
                    >
                        <div className={styles.faqHeader}>
                            <HelpCircle size={20} className={styles.titleIcon} style={{ width: 32, height: 32, background: 'transparent' }} />
                            <h3>Perguntas Frequentes</h3>
                        </div>
                        <div className={styles.faqList}>
                            {FAQS.map((faq, i) => (
                                <details key={i} className={styles.faqDetail}>
                                    <summary>
                                        <span>{faq.q}</span>
                                        <ChevronRight size={16} />
                                    </summary>
                                    <div className={styles.faqAnswer}>
                                        <p>{faq.a}</p>
                                    </div>
                                </details>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className={styles.knowledgeBaseCard}
                    >
                        <div className={styles.kbHeader}>
                            <div className={styles.kbIcon}>
                                <Headphones size={24} />
                            </div>
                            <h4>Base de Conhecimento</h4>
                        </div>
                        <div className={styles.kbContent}>
                            <p>Aprenda a dominar todas as ferramentas da plataforma com nossas videoaulas rápidas e práticas.</p>
                            <Button
                                variant="ghost"
                                size="sm"
                                style={{ color: 'var(--brand-primary)', padding: 0 }}
                                onClick={() => window.location.href = '/app/aulas'}
                            >
                                Acessar Aulas <ArrowRight size={14} style={{ marginLeft: 8 }} />
                            </Button>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className={styles.statusCard}
                    >
                        <div className={styles.statusLeft}>
                            <span className={styles.pulseDot}></span>
                            <span className={styles.statusLabel}>Sistemas Operacionais</span>
                        </div>
                        <span className={styles.statusValue}>Online</span>
                    </motion.div>
                </aside>
            </div>
        </div>
    );
}
