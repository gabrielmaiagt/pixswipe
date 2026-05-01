import Link from 'next/link';
import styles from './obrigado.module.css';

export const metadata = {
    title: 'Bem-vindo ao PIX Swipe!',
    description: 'Sua compra foi confirmada. Veja como acessar sua conta.',
};

export default function ObrigadoPage() {
    return (
        <div className={styles.page}>
            {/* Background glow */}
            <div className={styles.glow} />

            <div className={styles.card}>
                {/* Logo */}
                <div className={styles.logo}>
                    <span className={styles.logoText}>Pix</span>
                    <span className={styles.logoAccent}> Swipe</span>
                </div>

                {/* Checkmark */}
                <div className={styles.checkCircle}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                </div>

                <h1 className={styles.title}>Compra confirmada! 🎉</h1>
                <p className={styles.subtitle}>
                    Bem-vindo ao <strong>PIX Swipe</strong>. Sua conta já foi criada automaticamente.<br />
                    Use as credenciais abaixo para acessar agora mesmo.
                </p>

                {/* Credentials box */}
                <div className={styles.credBox}>
                    <div className={styles.credRow}>
                        <span className={styles.credLabel}>Site</span>
                        <span className={styles.credValue}>pixswipe.com/login</span>
                    </div>
                    <div className={styles.divider} />
                    <div className={styles.credRow}>
                        <span className={styles.credLabel}>E-mail</span>
                        <span className={styles.credValue}>O e-mail usado na compra</span>
                    </div>
                    <div className={styles.divider} />
                    <div className={styles.credRow}>
                        <span className={styles.credLabel}>Senha</span>
                        <span className={styles.credValueHighlight}>PixSwipe2024!</span>
                    </div>
                </div>

                <div className={styles.warning}>
                    ⚠️ <strong>Importante:</strong> após o primeiro login, vá em <strong>Perfil → Alterar Senha</strong> e troque para uma senha pessoal.
                </div>

                <Link href="/login" className={styles.btn}>
                    Acessar agora →
                </Link>

                <p className={styles.footer}>
                    Dúvidas? Fale com o suporte pelo WhatsApp ou dentro da plataforma.
                </p>
            </div>
        </div>
    );
}
