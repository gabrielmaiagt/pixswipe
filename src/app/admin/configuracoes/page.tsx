'use client';

import SettingsForm from '@/components/admin/SettingsForm';
import styles from '../admin.module.css';
import { Settings } from 'lucide-react';

export default function ConfigPage() {
    return (
        <div>
            <div className={styles.adminHeader}>
                <h1><Settings size={24} /> Configurações Gerais</h1>
            </div>
            <div style={{ maxWidth: 600 }}>
                <SettingsForm />
            </div>
        </div>
    );
}
