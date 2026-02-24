'use client';

import SetupPanel from '@/components/admin/SetupPanel';
import styles from './setup.module.css';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function SetupPage() {
    return (
        <div className={styles.setupPage}>
            <div className={styles.setupContainer}>
                <div className={styles.setupHeader}>
                    <h1>⚙️ Configuração Inicial</h1>
                    <p>Siga os passos abaixo para preparar seu ambiente Pix Swipe.</p>
                </div>

                <SetupPanel />

                <div className={styles.setupFooter}>
                    <Link href="/app" className={styles.backLink}>
                        <ArrowLeft size={16} /> Voltar para o Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
