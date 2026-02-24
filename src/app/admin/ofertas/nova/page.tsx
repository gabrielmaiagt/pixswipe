'use client';

import OfferForm from '@/components/admin/OfferForm';
import styles from '../../admin.module.css';

export default function NewOfferPage() {
    return (
        <div>
            <div className={styles.adminHeader}>
                <h1>Nova Oferta</h1>
            </div>
            <OfferForm />
        </div>
    );
}
