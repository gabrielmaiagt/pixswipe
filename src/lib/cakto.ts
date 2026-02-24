// ===========================
// Cakto — Payment Gateway Helpers
// ===========================

import crypto from 'crypto';
import type { PlanType } from '@/types';

// --- Webhook signature validation ---
export function validateCaktoWebhook(
    payload: string,
    signature: string
): boolean {
    const secret = process.env.CAKTO_WEBHOOK_SECRET;
    if (!secret) {
        console.error('[Cakto] CAKTO_WEBHOOK_SECRET not configured');
        return false;
    }

    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
    );
}

// --- Checkout URL builder ---
const CHECKOUT_URLS: Record<string, string | undefined> = {
    starter: process.env.CAKTO_CHECKOUT_URL_STARTER,
    pro: process.env.CAKTO_CHECKOUT_URL_PRO,
};

export function getCheckoutUrl(
    plan: PlanType,
    affiliateCode?: string | null,
    email?: string,
    overrides?: {
        checkoutUrlStarter?: string;
        checkoutUrlPro?: string;
    }
): string {
    const overrideKey = `checkoutUrl${plan.charAt(0).toUpperCase() + plan.slice(1)}` as keyof typeof overrides;
    const baseUrl = (overrides && overrides[overrideKey]) || CHECKOUT_URLS[plan];

    if (!baseUrl) {
        throw new Error(`URL de checkout não configurada para o plano: ${plan}`);
    }

    const url = new URL(baseUrl);

    if (affiliateCode) {
        url.searchParams.set('ref', affiliateCode);
    }
    if (email) {
        url.searchParams.set('email', email);
    }

    return url.toString();
}

// --- Customer portal URL ---
export function getCustomerPortalUrl(): string {
    return process.env.CAKTO_CUSTOMER_PORTAL_URL || '';
}

// --- Cakto webhook event types ---
export type CaktoEvent =
    | 'initiate_checkout'
    | 'checkout_abandonment'
    | 'purchase_approved'
    | 'purchase_refused'
    | 'pix_gerado'
    | 'refund'
    | 'chargeback'
    | 'subscription_created'
    | 'subscription_canceled'
    | 'subscription_renewed'
    | 'subscription_renewal_refused'
    | 'affiliate_sale'; // Maintain compatibility or custom events

export interface CaktoWebhookPayload {
    event: CaktoEvent;
    id?: string; // Some payloads use id for order
    sale_id?: string; // Keeping for compatibility
    customer: {
        name: string;
        email: string;
        phone?: string;
    };
    product?: {
        name: string;
        id: string;
    };
    amount: string | number;
    affiliate_code?: string;
    subscription_id?: string;
    period_end?: string;
    [key: string]: unknown;
}
