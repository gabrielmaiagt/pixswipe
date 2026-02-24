'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import OfferForm from '@/components/admin/OfferForm';
import type { Offer } from '@/types';
import styles from '../../admin.module.css';

export default function EditOfferPage() {
    const { id } = useParams();
    const [offer, setOffer] = useState<Offer | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetch() {
            if (!id) return;
            const snap = await getDoc(doc(db, 'offers', id as string));
            if (snap.exists()) {
                setOffer({ id: snap.id, ...snap.data() } as Offer);
            }
            setLoading(false);
        }
        fetch();
    }, [id]);

    if (loading) return <div className="skeleton" style={{ height: 400 }} />;
    if (!offer) return <div>Oferta não encontrada</div>;

    return (
        <div>
            <div className={styles.adminHeader}>
                <h1>Editar Oferta: {offer.title}</h1>
            </div>
            <OfferForm initialData={offer} offerId={offer.id} isEditing />
        </div>
    );
}
