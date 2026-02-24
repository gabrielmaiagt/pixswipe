'use client';

import { useState, useEffect } from 'react';
import { DollarSign, Users as UsersIcon } from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatBRL, formatDate } from '@/lib/utils';
import type { Affiliate } from '@/types';
import styles from '../admin.module.css';

export default function AdminAfiliados() {
    const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetch() {
            const snap = await getDocs(collection(db, 'affiliates'));
            setAffiliates(snap.docs.map((d) => ({ ...d.data() } as Affiliate)));
            setLoading(false);
        }
        fetch();
    }, []);

    return (
        <div>
            <div className={styles.adminHeader}><h1>Afiliados</h1></div>

            {loading ? (
                <div className={styles.kpiGrid}>
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="skeleton" style={{ height: 60, borderRadius: 8 }} />
                    ))}
                </div>
            ) : affiliates.length === 0 ? (
                <div className={styles.emptyAdmin}>
                    <UsersIcon size={48} />
                    <p>Nenhum afiliado registrado</p>
                </div>
            ) : (
                <table className={styles.dataTable}>
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Cliques</th>
                            <th>Vendas</th>
                            <th>Comissões</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {affiliates.map((aff) => (
                            <tr key={aff.affiliateCode}>
                                <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{aff.affiliateCode}</td>
                                <td>{aff.totalClicks}</td>
                                <td>{aff.totalSales}</td>
                                <td style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>{formatBRL(aff.totalEarnings)}</td>
                                <td>
                                    <span className={`${styles.statusPill} ${aff.paymentStatus === 'paid' ? styles.statusOk : styles.statusProcessing}`}>
                                        {aff.paymentStatus === 'paid' ? 'Pago' : 'Pendente'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
