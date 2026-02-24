'use client';

import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import styles from './InstallPrompt.module.css';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Check if already dismissed in this session
        if (sessionStorage.getItem('pwa-dismissed')) {
            setDismissed(true);
            return;
        }

        function handleBeforeInstall(e: Event) {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    }, []);

    async function handleInstall() {
        if (!deferredPrompt) return;
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
    }

    function handleDismiss() {
        setDismissed(true);
        setDeferredPrompt(null);
        sessionStorage.setItem('pwa-dismissed', '1');
    }

    if (!deferredPrompt || dismissed) return null;

    return (
        <div className={styles.installBanner}>
            <Download size={24} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
            <div className={styles.installInfo}>
                <h4>Instalar Pix Swipe</h4>
                <p>Acesse mais rápido pela tela inicial</p>
            </div>
            <div className={styles.installActions}>
                <button className={`${styles.installBtn} ${styles.installDismiss}`} onClick={handleDismiss}>
                    Depois
                </button>
                <button className={`${styles.installBtn} ${styles.installPrimary}`} onClick={handleInstall}>
                    Instalar
                </button>
            </div>
        </div>
    );
}
