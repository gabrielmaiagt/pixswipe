'use client';

import { ImageIcon } from 'lucide-react';
import AssetManager from '@/components/admin/AssetManager';
import styles from '../admin.module.css';

export default function AdminAssetsPage() {
    return (
        <div>
            <div className={styles.adminHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className={styles.kpiIcon} style={{ background: 'var(--brand-primary)', margin: 0 }}>
                        <ImageIcon size={20} />
                    </div>
                    <h1>Galeria de Assets</h1>
                </div>
            </div>

            <div className={styles.section} style={{ padding: 0, background: 'transparent', border: 'none' }}>
                <AssetManager />
            </div>
        </div>
    );
}
