import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import styles from '../legal.module.css';

export const metadata = {
    title: 'Política de Privacidade | Pix Swipe',
    description: 'Política de privacidade da plataforma Pix Swipe.',
};

export default function PrivacidadePage() {
    return (
        <div className={styles.legalPage}>
            <Link href="/" className={styles.backLink}>
                <ArrowLeft size={16} /> Voltar
            </Link>

            <h1>Política de Privacidade</h1>
            <p className={styles.lastUpdated}>Última atualização: Julho 2025</p>

            <h2>1. Dados Coletados</h2>
            <p>Coletamos os seguintes dados quando você utiliza nossa plataforma:</p>
            <ul>
                <li>Nome completo e e-mail (no cadastro)</li>
                <li>Dados de pagamento (processados pela Cakto)</li>
                <li>Dados de uso da plataforma (páginas acessadas, interações)</li>
                <li>Dados de cookies para autenticação</li>
            </ul>

            <h2>2. Uso dos Dados</h2>
            <p>Seus dados são utilizados para:</p>
            <ul>
                <li>Prover acesso à plataforma e gerenciar sua assinatura</li>
                <li>Enviar e-mails transacionais (confirmação, renovação, etc.)</li>
                <li>Melhorar a experiência do usuário</li>
                <li>Cumprir obrigações legais</li>
            </ul>

            <h2>3. Compartilhamento</h2>
            <p>
                Não vendemos seus dados. Compartilhamos apenas com:
            </p>
            <ul>
                <li>Cakto (processamento de pagamentos)</li>
                <li>Firebase/Google (infraestrutura e hospedagem)</li>
                <li>Resend (envio de e-mails transacionais)</li>
            </ul>

            <h2>4. Cookies</h2>
            <p>
                Utilizamos cookies essenciais para autenticação e manutenção da sessão.
                Não utilizamos cookies de rastreamento de terceiros.
            </p>

            <h2>5. Segurança</h2>
            <p>
                Seus dados são protegidos por criptografia em trânsito (HTTPS) e em
                repouso (Firebase). Implementamos controles de acesso rigorosos.
            </p>

            <h2>6. Seus Direitos (LGPD)</h2>
            <p>
                Conforme a Lei Geral de Proteção de Dados (LGPD), você tem direito a:
            </p>
            <ul>
                <li>Acessar seus dados pessoais</li>
                <li>Corrigir dados incorretos</li>
                <li>Solicitar exclusão dos seus dados</li>
                <li>Revogar consentimento</li>
            </ul>

            <h2>7. Contato</h2>
            <p>
                Para exercer seus direitos ou tirar dúvidas, entre em contato pelo{' '}
                <a
                    href={process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    WhatsApp de suporte
                </a>
                .
            </p>
        </div>
    );
}
