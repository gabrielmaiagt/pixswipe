'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Input } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import styles from '../auth.module.css';

export default function EsqueciSenhaPage() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError('');
        setSuccess(false);
        setLoading(true);

        try {
            await sendPasswordResetEmail(auth, email);
            setSuccess(true);
        } catch (err: any) {
            const code = err?.code || '';
            if (code === 'auth/user-not-found') {
                // Don't reveal whether email exists
                setSuccess(true);
            } else {
                setError('Erro ao enviar e-mail. Tente novamente.');
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
                <p className={styles.authSubtitle}>Recupere sua senha</p>

                {success ? (
                    <div className={styles.authSuccess}>
                        Se existe uma conta com esse e-mail, você receberá um link para
                        redefinir sua senha.
                    </div>
                ) : (
                    <form className={styles.authForm} onSubmit={handleSubmit}>
                        {error && <div className={styles.authError}>{error}</div>}

                        <Input
                            label="E-mail cadastrado"
                            type="email"
                            placeholder="seu@email.com"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />

                        <Button
                            type="submit"
                            fullWidth
                            loading={loading}
                            icon={<Mail size={16} />}
                        >
                            Enviar link de recuperação
                        </Button>
                    </form>
                )}

                <p className={styles.authFooter}>
                    Lembrou a senha? <Link href="/login">Fazer login</Link>
                </p>
            </motion.div>
        </div>
    );
}
