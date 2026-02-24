'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Check,
    ChevronRight,
    Target,
    BarChart,
    Rocket,
    Brain,
    Trophy,
    TrendingUp,
    Hash
} from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Button from '@/components/ui/Button';
import styles from './Onboarding.module.css';

interface OnboardingProps {
    uid: string;
    onComplete: () => void;
}

const NICHES = [
    { id: 'emagrecimento', label: 'Emagrecimento', icon: <Hash size={16} /> },
    { id: 'renda_extra', label: 'Renda Extra', icon: <TrendingUp size={16} /> },
    { id: 'relacionamento', label: 'Relacionamento', icon: <Target size={16} /> },
    { id: 'saude', label: 'Saúde & Bem-estar', icon: <Rocket size={16} /> },
    { id: 'marketing', label: 'Marketing Digital', icon: <BarChart size={16} /> },
];

const LEVELS = [
    { id: 'iniciante', label: 'Iniciante', desc: 'Estou começando agora no digital', icon: <Brain size={18} /> },
    { id: 'ja_rodo_x1', label: 'Já rodo X1', desc: 'Tenho resultados, mas quero melhorar', icon: <TrendingUp size={18} /> },
    { id: 'avancado', label: 'Avançado', desc: 'Faturamento alto, foco em escala', icon: <Trophy size={18} /> },
];

const GOALS = [
    { id: 'comecar_do_zero', label: 'Começar do Zero', desc: 'Fazer minha primeira venda' },
    { id: 'escalar', label: 'Escalar faturamento', desc: 'Sair de 1k para 10k+ por mês' },
    { id: 'diversificar', label: 'Diversificar Ofertas', desc: 'Testar novos nichos e produtos' },
];

export default function Onboarding({ uid, onComplete }: OnboardingProps) {
    const [step, setStep] = useState(1);
    const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
    const [level, setLevel] = useState<string>('');
    const [goal, setGoal] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const toggleNiche = (id: string) => {
        setSelectedNiches(prev =>
            prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]
        );
    };

    const handleFinish = async () => {
        setLoading(true);
        try {
            const userRef = doc(db, 'users', uid);
            await updateDoc(userRef, {
                onboarding: {
                    niches: selectedNiches,
                    level,
                    goal,
                    completed: true
                }
            });
            onComplete();
        } catch (err) {
            console.error('Onboarding update error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.onboardingOverlay}>
            <motion.div
                className={styles.onboardingCard}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
            >
                <div className={styles.stepIndicator}>
                    {[1, 2, 3].map(s => (
                        <div key={s} className={`${styles.stepDot} ${step >= s ? styles.stepDotActive : ''}`} />
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <div className={styles.onboardingHeader}>
                                <h2>Quais nichos lhe interessam?</h2>
                                <p>Selecione os mercados que você mais deseja atuar.</p>
                            </div>
                            <div className={styles.optionsGrid}>
                                {NICHES.map(n => (
                                    <div
                                        key={n.id}
                                        className={`${styles.optionCard} ${selectedNiches.includes(n.id) ? styles.optionCardSelected : ''}`}
                                        onClick={() => toggleNiche(n.id)}
                                    >
                                        <div className={styles.optionIcon}>{n.icon}</div>
                                        <div className={styles.optionInfo}>
                                            <h4>{n.label}</h4>
                                        </div>
                                        {selectedNiches.includes(n.id) && <Check size={16} className={styles.checkIcon} />}
                                    </div>
                                ))}
                            </div>
                            <Button
                                fullWidth
                                onClick={() => setStep(2)}
                                disabled={selectedNiches.length === 0}
                                icon={<ChevronRight size={18} />}
                            >
                                Próximo Passo
                            </Button>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <div className={styles.onboardingHeader}>
                                <h2>Qual seu nível atual?</h2>
                                <p>Saber seu nível nos ajuda a recomendar conteúdo ideal.</p>
                            </div>
                            <div className={styles.optionsGrid}>
                                {LEVELS.map(l => (
                                    <div
                                        key={l.id}
                                        className={`${styles.optionCard} ${level === l.id ? styles.optionCardSelected : ''}`}
                                        onClick={() => setLevel(l.id)}
                                    >
                                        <div className={styles.optionIcon}>{l.icon}</div>
                                        <div className={styles.optionInfo}>
                                            <h4>{l.label}</h4>
                                            <p>{l.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className={styles.onboardingActions}>
                                <Button variant="ghost" onClick={() => setStep(1)}>Voltar</Button>
                                <Button
                                    onClick={() => setStep(3)}
                                    disabled={!level}
                                    icon={<ChevronRight size={18} />}
                                >
                                    Próximo Passo
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <div className={styles.onboardingHeader}>
                                <h2>Qual seu objetivo principal?</h2>
                                <p>O que você espera alcançar com o Pix Swipe?</p>
                            </div>
                            <div className={styles.optionsGrid}>
                                {GOALS.map(g => (
                                    <div
                                        key={g.id}
                                        className={`${styles.optionCard} ${goal === g.id ? styles.optionCardSelected : ''}`}
                                        onClick={() => setGoal(g.id)}
                                    >
                                        <div className={styles.optionInfo}>
                                            <h4>{g.label}</h4>
                                            <p>{g.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className={styles.onboardingActions}>
                                <Button variant="ghost" onClick={() => setStep(2)}>Voltar</Button>
                                <Button
                                    onClick={handleFinish}
                                    disabled={!goal || loading}
                                    icon={<Check size={18} />}
                                >
                                    {loading ? 'Salvando...' : 'Finalizar Onboarding'}
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
