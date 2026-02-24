// ===========================
// Email Service — Resend
// All emails in Portuguese (pt-BR)
// ===========================

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@pixswipe.com.br';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// --- Welcome email (after payment approved) ---
export async function sendWelcomeEmail(email: string, name: string) {
    return resend.emails.send({
        from: `Pix Swipe <${FROM_EMAIL}>`,
        to: email,
        subject: '🎉 Seu acesso ao Pix Swipe está liberado!',
        html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f0f; color: #e0e0e0; padding: 40px; border-radius: 12px;">
        <h1 style="color: #00d4aa; margin-bottom: 8px;">Bem-vindo ao Pix Swipe!</h1>
        <p>Olá, <strong>${name || 'membro'}</strong>! 👋</p>
        <p>Seu pagamento foi confirmado e seu acesso está <strong>100% liberado</strong>.</p>
        <p>Agora é hora de criar sua conta e começar a rodar suas ofertas X1.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${APP_URL}/criar-conta" 
             style="background: linear-gradient(135deg, #00d4aa, #00b894); color: #0f0f0f; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px;">
            Criar minha conta
          </a>
        </div>
        <p style="color: #888; font-size: 14px;">Se você já tem conta, basta fazer login e acessar.</p>
        <hr style="border: 1px solid #222; margin: 32px 0;" />
        <p style="color: #666; font-size: 12px;">Pix Swipe — Ofertas X1 prontas para rodar.</p>
      </div>
    `,
    });
}

// --- Payment failure email ---
export async function sendPaymentFailureEmail(email: string, name: string) {
    return resend.emails.send({
        from: `Pix Swipe <${FROM_EMAIL}>`,
        to: email,
        subject: '⚠️ Problema no seu pagamento — Pix Swipe',
        html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f0f; color: #e0e0e0; padding: 40px; border-radius: 12px;">
        <h1 style="color: #ff6b6b; margin-bottom: 8px;">Problema no pagamento</h1>
        <p>Olá, <strong>${name || 'membro'}</strong>,</p>
        <p>Tivemos um problema ao processar seu último pagamento. Para continuar acessando as ofertas e aulas, atualize seus dados de pagamento.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${APP_URL}/app/assinatura" 
             style="background: linear-gradient(135deg, #ff6b6b, #ee5a24); color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px;">
            Atualizar pagamento
          </a>
        </div>
        <p style="color: #888; font-size: 14px;">Se precisar de ajuda, entre em contato pelo suporte dentro da plataforma.</p>
        <hr style="border: 1px solid #222; margin: 32px 0;" />
        <p style="color: #666; font-size: 12px;">Pix Swipe — Ofertas X1 prontas para rodar.</p>
      </div>
    `,
    });
}

// --- Renewal confirmed email ---
export async function sendRenewalEmail(email: string, name: string) {
    return resend.emails.send({
        from: `Pix Swipe <${FROM_EMAIL}>`,
        to: email,
        subject: '✅ Assinatura renovada com sucesso — Pix Swipe',
        html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f0f; color: #e0e0e0; padding: 40px; border-radius: 12px;">
        <h1 style="color: #00d4aa; margin-bottom: 8px;">Assinatura renovada! ✅</h1>
        <p>Olá, <strong>${name || 'membro'}</strong>,</p>
        <p>Sua assinatura do Pix Swipe foi renovada com sucesso. Continue aproveitando todas as ofertas e aulas.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${APP_URL}/app/dashboard" 
             style="background: linear-gradient(135deg, #00d4aa, #00b894); color: #0f0f0f; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px;">
            Acessar plataforma
          </a>
        </div>
        <hr style="border: 1px solid #222; margin: 32px 0;" />
        <p style="color: #666; font-size: 12px;">Pix Swipe — Ofertas X1 prontas para rodar.</p>
      </div>
    `,
    });
}

// --- Cancellation confirmed email ---
export async function sendCancellationEmail(
    email: string,
    name: string,
    accessUntil: string
) {
    return resend.emails.send({
        from: `Pix Swipe <${FROM_EMAIL}>`,
        to: email,
        subject: 'Acesso cancelado — Pix Swipe',
        html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f0f; color: #e0e0e0; padding: 40px; border-radius: 12px;">
        <h1 style="color: #ffa502; margin-bottom: 8px;">Assinatura cancelada</h1>
        <p>Olá, <strong>${name || 'membro'}</strong>,</p>
        <p>Sua assinatura foi cancelada. Você ainda tem acesso à plataforma até <strong>${accessUntil}</strong>.</p>
        <p>Depois dessa data, seu acesso será bloqueado. Mas você pode reativar a qualquer momento!</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${APP_URL}/precos" 
             style="background: linear-gradient(135deg, #ffa502, #e17e00); color: #0f0f0f; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px;">
            Reassinar
          </a>
        </div>
        <hr style="border: 1px solid #222; margin: 32px 0;" />
        <p style="color: #666; font-size: 12px;">Pix Swipe — Ofertas X1 prontas para rodar.</p>
      </div>
    `,
    });
}

// --- New offer published (optional notification) ---
export async function sendNewOfferEmail(
    email: string,
    name: string,
    offerTitle: string,
    offerId: string
) {
    return resend.emails.send({
        from: `Pix Swipe <${FROM_EMAIL}>`,
        to: email,
        subject: `🔥 Nova oferta X1 disponível: ${offerTitle}`,
        html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f0f; color: #e0e0e0; padding: 40px; border-radius: 12px;">
        <h1 style="color: #00d4aa; margin-bottom: 8px;">Nova oferta disponível! 🔥</h1>
        <p>Olá, <strong>${name || 'membro'}</strong>,</p>
        <p>Acabamos de publicar uma nova oferta X1:</p>
        <div style="background: #1a1a2e; border: 1px solid #2a2a4a; border-radius: 8px; padding: 20px; margin: 16px 0;">
          <h2 style="color: #fff; margin: 0 0 8px;">${offerTitle}</h2>
          <p style="color: #aaa; margin: 0;">Criativos, funil do WhatsApp e tutorial de implementação inclusos.</p>
        </div>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${APP_URL}/app/ofertas/${offerId}" 
             style="background: linear-gradient(135deg, #00d4aa, #00b894); color: #0f0f0f; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px;">
            Ver oferta
          </a>
        </div>
        <hr style="border: 1px solid #222; margin: 32px 0;" />
        <p style="color: #666; font-size: 12px;">Pix Swipe — Ofertas X1 prontas para rodar.</p>
      </div>
    `,
    });
}
