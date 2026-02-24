'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { UserPlus } from 'lucide-react';
import { signUp } from '@/lib/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Input } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import styles from '../auth.module.css';

export default function CadastroPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setLoading(true);

        try {
            const credential = await signUp(email, password);
            const user = credential.user;

            // Create user document in Firestore
            await setDoc(doc(db, 'users', user.uid), {
                email: user.email,
                name: name,
                avatarUrl: null,
                role: 'user',
                plan: 'starter',
                entitlementStatus: 'active',
                currentPeriodEnd: null,
                paymentProviderCustomerId: null,
                onboarding: {
                    niches: [],
                    level: 'iniciante',
                    goal: 'comecar_do_zero',
                    completed: false,
                },
                metrics: {
                    offersViewed: 0,
                    lessonsDone: 0,
                    totalTimeMinutes: 0,
                    lastSeen: serverTimestamp(),
                },
                affiliateCode: null,
                affiliateReferredBy: null,
                createdAt: serverTimestamp(),
            });

            router.push('/app');
        } catch (err: any) {
            const code = err?.code || '';
            if (code === 'auth/email-already-in-use') {
                setError('Este e-mail já está cadastrado.');
            } else if (code === 'auth/weak-password') {
                setError('A senha deve ter pelo menos 6 caracteres.');
            } else if (code === 'auth/invalid-email') {
                setError('E-mail inválido.');
            } else {
                setError('Erro ao criar conta. Tente novamente.');
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={styles.authPage}>
            <motion.div
                className={styles.authCard}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <div className={styles.authLogo}>
                    <span>Pix</span> Swipe
                </div>
                <p className={styles.authSubtitle}>Crie sua conta gratuita</p>

                <form className={styles.authForm} onSubmit={handleSubmit}>
                    {error && <div className={styles.authError}>{error}</div>}

                    <Input
                        label="Nome completo"
                        type="text"
                        placeholder="Seu nome"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />

                    <Input
                        label="E-mail"
                        type="email"
                        placeholder="seu@email.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <Input
                        label="Senha"
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <Button
                        type="submit"
                        fullWidth
                        loading={loading}
                        icon={<UserPlus size={16} />}
                    >
                        Criar conta
                    </Button>
                </form>

                <p className={styles.authFooter}>
                    Já tem conta? <Link href="/login">Fazer login</Link>
                </p>
            </motion.div>
        </div>
    );
}
