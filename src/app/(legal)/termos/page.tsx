import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import styles from '../legal.module.css';

export const metadata = {
    title: 'Termos de Uso | Pix Swipe',
    description: 'Termos de uso da plataforma Pix Swipe.',
};

export default function TermosPage() {
    return (
        <div className={styles.legalPage}>
            <Link href="/" className={styles.backLink}>
                <ArrowLeft size={16} /> Voltar
            </Link>

            <h1>Termos de Uso</h1>
            <p className={styles.lastUpdated}>Última atualização: Julho 2025</p>

            <h2>1. Aceitação dos Termos</h2>
            <p>
                Ao acessar ou utilizar a plataforma Pix Swipe, você concorda com estes
                Termos de Uso. Se não concordar, não utilize o serviço.
            </p>

            <h2>2. Descrição do Serviço</h2>
            <p>
                O Pix Swipe é uma plataforma de assinatura que fornece ofertas de venda
                direta (X1) prontas, incluindo criativos, sequências de mensagens para
                WhatsApp e aulas de implementação.
            </p>

            <h2>3. Planos e Pagamento</h2>
            <ul>
                <li>Os pagamentos são processados pela plataforma Cakto.</li>
                <li>A assinatura é recorrente e será renovada automaticamente.</li>
                <li>Você pode cancelar a qualquer momento pelo painel.</li>
                <li>Após cancelamento, o acesso permanece até o fim do período pago.</li>
            </ul>

            <h2>4. Uso do Conteúdo</h2>
            <ul>
                <li>O conteúdo é para uso pessoal/comercial do assinante.</li>
                <li>É proibido revender, redistribuir ou compartilhar o acesso.</li>
                <li>Os criativos podem ser usados em suas campanhas de marketing.</li>
            </ul>

            <h2>5. Programa de Afiliados</h2>
            <p>
                Membros podem participar do programa de afiliados e receber comissões
                sobre vendas indicadas, conforme as regras vigentes na plataforma.
            </p>

            <h2>6. Isenção de Garantia</h2>
            <p>
                O Pix Swipe não garante resultados financeiros. Os resultados dependem
                de diversos fatores como investimento em tráfego, execução e mercado.
            </p>

            <h2>7. Alterações</h2>
            <p>
                Podemos alterar estes termos a qualquer momento. Alterações significativas
                serão comunicadas por e-mail ou notificação na plataforma.
            </p>

            <h2>8. Contato</h2>
            <p>
                Dúvidas sobre estes termos? Entre em contato pelo nosso{' '}
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
