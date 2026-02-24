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
import styles from '@/app/app/afiliados/afiliados.module.css';

export default function AfiliadosPage() {
    const { firebaseUser, userData } = useAuth();
    const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
    const [loading, setLoading] = useState(true);

    const affiliateLink = userData?.affiliateCode
        ? `${typeof window !== 'undefined' ? window.location.origin : ''}/r?ref=${userData.affiliateCode}`
        : '';

    useEffect(() => {
        if (!firebaseUser) return;
        async function fetchAffiliate() {
            try {
                const snap = await getDoc(doc(db, 'affiliates', firebaseUser!.uid));
                if (snap.exists()) {
                    setAffiliate(snap.data() as Affiliate);
                }
            } catch (err) {
                console.error('Error:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchAffiliate();
    }, [firebaseUser]);

    function handleCopy() {
        copyToClipboard(affiliateLink);
        toast.success('Link copiado!');
    }

    if (loading) {
        return (
            <div className={styles.affiliatePage}>
                <h1>Afiliados</h1>
                <div className={styles.statsGrid}>
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="skeleton" style={{ height: 90, borderRadius: 12 }} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={styles.affiliatePage}>
            <h1>Afiliados</h1>

            {/* Stats */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>{affiliate?.totalClicks || 0}</div>
                    <div className={styles.statLabel}><MousePointerClick size={12} /> Cliques</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>{affiliate?.totalSales || 0}</div>
                    <div className={styles.statLabel}><ShoppingCart size={12} /> Vendas</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>
                        {formatBRL(affiliate?.totalEarnings || 0)}
                    </div>
                    <div className={styles.statLabel}><DollarSign size={12} /> Comissões</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>
                        {affiliate?.totalSales && affiliate.totalClicks
                            ? ((affiliate.totalSales / affiliate.totalClicks) * 100).toFixed(1) + '%'
                            : '0%'}
                    </div>
                    <div className={styles.statLabel}>Conversão</div>
                </div>
            </div>

            {/* Affiliate link */}
            <div className={styles.linkSection}>
                <h3><Link2 size={16} /> Seu link de afiliado</h3>
                <div className={styles.linkRow}>
                    <input
                        className={styles.linkInput}
                        value={affiliateLink}
                        readOnly
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <Button icon={<Copy size={14} />} onClick={handleCopy}>
                        Copiar
                    </Button>
                </div>
            </div>

            {/* Referrals */}
            <div className={styles.referralsSection}>
                <h3>Histórico de indicações</h3>
                {affiliate?.referrals && affiliate.referrals.length > 0 ? (
                    <table className={styles.referralTable}>
                        <thead>
                            <tr>
                                <th>Plano</th>
                                <th>Valor</th>
                                <th>Comissão</th>
                                <th>Data</th>
                            </tr>
                        </thead>
                        <tbody>
                            {affiliate.referrals.map((ref, i) => (
                                <tr key={i}>
                                    <td>{ref.plan}</td>
                                    <td>{formatBRL(ref.amount)}</td>
                                    <td style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>
                                        {formatBRL(ref.commission)}
                                    </td>
                                    <td>{ref.date?.toDate?.().toLocaleDateString('pt-BR') || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className={styles.emptyReferrals}>
                        <Users size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
                        <p>Nenhuma indicação ainda. Compartilhe seu link para começar!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
