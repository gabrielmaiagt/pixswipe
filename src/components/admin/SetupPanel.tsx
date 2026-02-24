'use client';

import { useState } from 'react';
import {
    Settings,
    UserPlus,
    ShieldCheck,
    AlertCircle,
    Loader2,
    Database,
    ExternalLink
} from 'lucide-react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import styles from './SetupPanel.module.css';

export default function SetupPanel() {
    const { userData, firebaseUser } = useAuth();
    const [loading, setLoading] = useState(false);

    const elevateToAdmin = async () => {
        if (!firebaseUser) {
            toast.error('Você precisa estar logado para se tornar admin');
            return;
        }

        setLoading(true);
        try {
            const userRef = doc(db, 'users', firebaseUser.uid);
            await updateDoc(userRef, {
                role: 'admin'
            });
            toast.success('Você agora é um Administrador! Recarregue a página.');
            setTimeout(() => window.location.reload(), 2000);
        } catch (err) {
            console.error(err);
            toast.error('Erro ao elevar privilégios. Verifique as regras do Firestore.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.setupPanel}>
            <div className={styles.setupHeader}>
                <Settings size={20} />
                <h2>Guia de Configuração Inicial</h2>
            </div>

            <div className={styles.setupContent}>
                <div className={styles.setupStep}>
                    <div className={styles.stepIcon}><UserPlus size={18} /></div>
                    <div className={styles.stepInfo}>
                        <h3>1. Criar Primeiro Admin</h3>
                        <p>
                            Após criar sua conta no Pix Swipe, use este botão para se tornar
                            o administrador mestre do sistema.
                        </p>
                        <button
                            className={styles.setupBtn}
                            onClick={elevateToAdmin}
                            disabled={loading || userData?.role === 'admin'}
                        >
                            {loading ? <Loader2 size={16} className={styles.spin} /> : <ShieldCheck size={16} />}
                            {userData?.role === 'admin' ? 'Já é Administrador' : 'Tornar-me Admin'}
                        </button>
                    </div>
                </div>

                <div className={styles.setupStep}>
                    <div className={styles.stepIcon}><Database size={18} /></div>
                    <div className={styles.stepInfo}>
                        <h3>2. Configurar Firebase & Cakto</h3>
                        <p>
                            Certifique-se de preencher o arquivo <code>.env.local</code> com suas credenciais
                            e fazer o deploy das regras do Firestore.
                        </p>
                        <div className={styles.links}>
                            <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer">
                                Console Firebase <ExternalLink size={12} />
                            </a>
                            <a href="https://cakto.com/" target="_blank" rel="noreferrer">
                                Painel Cakto <ExternalLink size={12} />
                            </a>
                        </div>
                    </div>
                </div>

                <div className={styles.setupStep}>
                    <div className={styles.stepIcon}><AlertCircle size={18} /></div>
                    <div className={styles.stepInfo}>
                        <h3>3. Ativar Webhooks</h3>
                        <p>
                            Configure a URL <code>{typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/cakto</code>
                            no painel da Cakto para receber confirmações de pagamento.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
