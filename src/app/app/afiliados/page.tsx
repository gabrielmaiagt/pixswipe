'use client';

import { useState, useEffect } from 'react';
import { Link2, Copy, MousePointerClick, ShoppingCart, DollarSign, Users } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import type { Affiliate } from '@/types';
import { copyToClipboard, formatBRL } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';
import styles from '@/app/app/afiliados/afiliados.module.css';

export default function AfiliadosPage() {
    const { firebaseUser } = useAuth();
    const [recruitmentUrl, setRecruitmentUrl] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!firebaseUser) return;
        async function fetchData() {
            try {
                const settingsSnap = await getDoc(doc(db, 'settings', 'general'));
                if (settingsSnap.exists()) {
                    setRecruitmentUrl(settingsSnap.data().caktoRecruitmentUrl || 'https://cakto.com.br');
                }
            } catch (err) {
                console.error('Error fetching settings:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [firebaseUser]);

    if (loading) {
        return (
            <div className={styles.affiliatePage}>
                <h1>Afiliados</h1>
                <div className="skeleton" style={{ height: 300, borderRadius: 20 }} />
            </div>
        );
    }

    return (
        <div className={styles.affiliatePage}>
            <div className={styles.header}>
                <h1>Programa de Parceiros</h1>
                <p>Ganhe comissões indicando o Vortex Swipe para outros players.</p>
            </div>

            <div className={styles.recruitmentContainer}>
                <div className={styles.recruitmentIcon}>
                    <DollarSign size={48} />
                </div>
                <h2 className={styles.recruitmentTitle}>Seja um Afiliado Vortex Swipe</h2>
                <p className={styles.recruitmentText}>
                    Nossa afiliação é gerida diretamente pela <strong>Cakto</strong>. Como parceiro, você recebe <strong>50% de comissão</strong> por cada assinatura realizada através da sua indicação.
                </p>

                <div className={styles.benefitsList}>
                    <div className={styles.benefitItem}>
                        <div className={styles.benefitDot}></div>
                        <span>Comissão recorrente de 50%</span>
                    </div>
                    <div className={styles.benefitItem}>
                        <div className={styles.benefitDot}></div>
                        <span>Pagamento garantido pela Cakto</span>
                    </div>
                    <div className={styles.benefitItem}>
                        <div className={styles.benefitDot}></div>
                        <span>Material de apoio exclusivo</span>
                    </div>
                </div>

                <div className={styles.recruitmentActions}>
                    <a href={recruitmentUrl} target="_blank" rel="noreferrer" style={{ width: '100%' }}>
                        <Button size="lg" style={{ width: '100%', height: 56, fontSize: 16 }}>
                            Quero me afiliar agora na Cakto
                        </Button>
                    </a>
                    <p className={styles.infoNote}>
                        O rastreamento de vendas e pagamentos é feito automaticamente pela plataforma Cakto.
                    </p>
                </div>
            </div>

            <div className={styles.instructions}>
                <h3>Como funciona?</h3>
                <div className={styles.steps}>
                    <div className={styles.step}>
                        <div className={styles.stepNum}>1</div>
                        <p>Clique no botão acima para abrir a página de afiliação na Cakto.</p>
                    </div>
                    <div className={styles.step}>
                        <div className={styles.stepNum}>2</div>
                        <p>Solicite sua afiliação e aguarde nossa aprovação rápida.</p>
                    </div>
                    <div className={styles.step}>
                        <div className={styles.stepNum}>3</div>
                        <p>Pegue seu link na Cakto e comece a divulgar!</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
