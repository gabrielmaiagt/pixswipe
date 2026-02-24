'use client';

import { ImageIcon } from 'lucide-react';
import styles from '../admin.module.css';

export default function AdminAssets() {
    return (
        <div>
            <div className={styles.adminHeader}><h1>Assets Gallery</h1></div>
            <div className={styles.emptyAdmin}>
                <ImageIcon size={48} />
                <h3 style={{ marginTop: 12 }}>Em breve</h3>
                <p>A galeria de assets será implementada com Firebase Storage.</p>
            </div>
        </div>
    );
}
