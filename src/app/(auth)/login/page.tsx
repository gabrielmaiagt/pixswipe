'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LogIn } from 'lucide-react';
import { signIn } from '@/lib/auth';
import { Input } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import styles from '../auth.module.css';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signIn(email, password);
            router.push('/app');
        } catch (err: any) {
            const code = err?.code || '';
            if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
                setError('E-mail ou senha incorretos.');
            } else if (code === 'auth/too-many-requests') {
                setError('Muitas tentativas. Tente novamente em alguns minutos.');
            } else {
                setError('Erro ao fazer login. Tente novamente.');
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
                <p className={styles.authSubtitle}>Acesse sua conta</p>

                <form className={styles.authForm} onSubmit={handleSubmit}>
                    {error && <div className={styles.authError}>{error}</div>}

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
                        placeholder="••••••••"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <div className={styles.forgotLink}>
                        <Link href="/esqueci-senha">Esqueceu a senha?</Link>
                    </div>

                    <Button
                        type="submit"
                        fullWidth
                        loading={loading}
                        icon={<LogIn size={16} />}
                    >
                        Entrar
                    </Button>
                </form>

                <p className={styles.authFooter}>
                    Não tem conta? <Link href="/cadastro">Criar conta</Link>
                </p>
            </motion.div>
        </div>
    );
}
