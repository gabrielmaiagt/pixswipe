'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, Eye, Package } from 'lucide-react';
import { collection, getDocs, deleteDoc, doc, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { StatusBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import type { Offer } from '@/types';
import toast from 'react-hot-toast';
import styles from '../admin.module.css';

export default function AdminOffers() {
    const [offers, setOffers] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetch() {
            const snap = await getDocs(query(collection(db, 'offers'), orderBy('createdAt', 'desc')));
            setOffers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Offer)));
            setLoading(false);
        }
        fetch();
    }, []);

    async function handleDelete(id: string) {
        if (!confirm('Deletar esta oferta permanentemente?')) return;
        await deleteDoc(doc(db, 'offers', id));
        setOffers((prev) => prev.filter((o) => o.id !== id));
        toast.success('Oferta deletada');
    }

    return (
        <div>
            <div className={styles.adminHeader}>
                <h1>Ofertas</h1>
                <Button icon={<Plus size={16} />}>Nova oferta</Button>
            </div>

            {loading ? (
                <div className={styles.kpiGrid}>
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="skeleton" style={{ height: 60, borderRadius: 8 }} />
                    ))}
                </div>
            ) : offers.length === 0 ? (
                <div className={styles.emptyAdmin}>
                    <Package size={48} />
                    <p>Nenhuma oferta criada</p>
                </div>
            ) : (
                <table className={styles.dataTable}>
                    <thead>
                        <tr>
                            <th>Título</th>
                            <th>Nicho</th>
                            <th>Status</th>
                            <th>Ticket</th>
                            <th>Views</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {offers.map((offer) => (
                            <tr key={offer.id}>
                                <td style={{ fontWeight: 600 }}>{offer.title}</td>
                                <td>{offer.niche}</td>
                                <td><StatusBadge status={offer.status} /></td>
                                <td>R${offer.ticket.toFixed(2).replace('.', ',')}</td>
                                <td>{offer.views}</td>
                                <td>
                                    <div className={styles.tableActions}>
                                        <Link href={`/app/ofertas/${offer.id}`}>
                                            <button className={styles.editBtn}><Eye size={12} /> Ver</button>
                                        </Link>
                                        <button className={styles.editBtn}><Edit size={12} /> Editar</button>
                                        <button className={styles.deleteBtn} onClick={() => handleDelete(offer.id)}>
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
