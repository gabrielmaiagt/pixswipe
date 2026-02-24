// ===========================
// Cakto Webhook Handler
// POST /api/webhooks/cakto
// ===========================

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { validateCaktoWebhook, type CaktoWebhookPayload } from '@/lib/cakto';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
    const receivedAt = Timestamp.now();
    let rawPayload = '';

    try {
        rawPayload = await request.text();
        const signature = request.headers.get('x-cakto-signature') || '';

        // 1. Validate webhook signature
        if (!validateCaktoWebhook(rawPayload, signature)) {
            console.error('[Webhook] Invalid signature');
            return NextResponse.json(
                { error: 'Assinatura inválida' },
                { status: 401 }
            );
        }

        const payload: CaktoWebhookPayload = JSON.parse(rawPayload);

        // 2. Log the webhook
        const logRef = adminDb.collection('webhookLogs').doc();
        await logRef.set({
            event: payload.event,
            payload: payload,
            status: 'processing',
            error: null,
            receivedAt,
            processedAt: null,
        });

        // 3. Process event
        try {
            await processEvent(payload);

            // 4. Mark as success
            await logRef.update({
                status: 'ok',
                processedAt: Timestamp.now(),
            });
        } catch (processError: unknown) {
            const errorMessage = processError instanceof Error
                ? processError.message
                : 'Erro desconhecido';

            // 4b. Mark as failed
            await logRef.update({
                status: 'failed',
                error: errorMessage,
                processedAt: Timestamp.now(),
            });

            console.error('[Webhook] Processing error:', errorMessage);
        }

        return NextResponse.json({ received: true }, { status: 200 });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Erro inesperado';
        console.error('[Webhook] Fatal error:', errorMessage);

        // Log failed webhook
        try {
            await adminDb.collection('webhookLogs').add({
                event: 'unknown',
                payload: rawPayload ? JSON.parse(rawPayload) : {},
                status: 'failed',
                error: errorMessage,
                receivedAt,
                processedAt: Timestamp.now(),
            });
        } catch {
            // If even logging fails, just continue
        }

        return NextResponse.json(
            { error: 'Erro interno' },
            { status: 500 }
        );
    }
}

// --- Process each event type ---
async function processEvent(payload: CaktoWebhookPayload) {
    const { event, customer_email, sale_id } = payload;

    // Find user by email
    const usersSnap = await adminDb
        .collection('users')
        .where('email', '==', customer_email)
        .limit(1)
        .get();

    switch (event) {
        case 'payment_approved':
            await handlePaymentApproved(payload, usersSnap);
            break;
        case 'payment_declined':
            await handlePaymentDeclined(payload, usersSnap);
            break;
        case 'subscription_canceled':
            await handleSubscriptionCanceled(payload, usersSnap);
            break;
        case 'subscription_renewed':
            await handleSubscriptionRenewed(payload, usersSnap);
            break;
        case 'affiliate_sale':
            await handleAffiliateSale(payload);
            break;
        default:
            console.warn(`[Webhook] Unknown event type: ${event}`);
    }
}

async function handlePaymentApproved(
    payload: CaktoWebhookPayload,
    usersSnap: FirebaseFirestore.QuerySnapshot
) {
    const plan = normalizePlan(payload.plan);
    const periodEnd = payload.period_end
        ? Timestamp.fromDate(new Date(payload.period_end))
        : Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

    if (!usersSnap.empty) {
        // Update existing user
        const userDoc = usersSnap.docs[0];
        await userDoc.ref.update({
            plan,
            entitlementStatus: 'active',
            currentPeriodEnd: periodEnd,
            paymentProviderCustomerId: payload.subscription_id || null,
        });
    }
    // If no user exists, they'll create an account later and the
    // system will match by email during signup

    // Create payment record (idempotent check)
    const existingPayment = await adminDb
        .collection('payments')
        .where('caktoSaleId', '==', payload.sale_id)
        .limit(1)
        .get();

    if (existingPayment.empty) {
        await adminDb.collection('payments').add({
            uid: usersSnap.empty ? null : usersSnap.docs[0].id,
            caktoSaleId: payload.sale_id,
            amount: payload.amount,
            plan,
            status: 'approved',
            createdAt: Timestamp.now(),
        });
    }

    // Create/update subscription
    if (!usersSnap.empty && payload.subscription_id) {
        await adminDb.collection('subscriptions').doc(payload.subscription_id).set(
            {
                uid: usersSnap.docs[0].id,
                provider: 'cakto',
                plan,
                status: 'active',
                currentPeriodEnd: periodEnd,
                cancelAtPeriodEnd: false,
                updatedAt: Timestamp.now(),
            },
            { merge: true }
        );
    }
}

async function handlePaymentDeclined(
    payload: CaktoWebhookPayload,
    usersSnap: FirebaseFirestore.QuerySnapshot
) {
    if (!usersSnap.empty) {
        const userDoc = usersSnap.docs[0];
        await userDoc.ref.update({
            entitlementStatus: 'past_due',
        });
    }

    // Email will be triggered by a separate Cloud Function or
    // called directly here if needed
}

async function handleSubscriptionCanceled(
    payload: CaktoWebhookPayload,
    usersSnap: FirebaseFirestore.QuerySnapshot
) {
    if (!usersSnap.empty) {
        const userDoc = usersSnap.docs[0];
        // Keep active until period end
        await userDoc.ref.update({
            entitlementStatus: 'active', // stays active until period end
        });

        if (payload.subscription_id) {
            await adminDb
                .collection('subscriptions')
                .doc(payload.subscription_id)
                .update({
                    cancelAtPeriodEnd: true,
                    status: 'canceled',
                    updatedAt: Timestamp.now(),
                });
        }
    }
}

async function handleSubscriptionRenewed(
    payload: CaktoWebhookPayload,
    usersSnap: FirebaseFirestore.QuerySnapshot
) {
    const plan = normalizePlan(payload.plan);
    const periodEnd = payload.period_end
        ? Timestamp.fromDate(new Date(payload.period_end))
        : Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

    if (!usersSnap.empty) {
        const userDoc = usersSnap.docs[0];
        await userDoc.ref.update({
            plan,
            entitlementStatus: 'active',
            currentPeriodEnd: periodEnd,
        });

        // Create payment record
        await adminDb.collection('payments').add({
            uid: userDoc.id,
            caktoSaleId: payload.sale_id,
            amount: payload.amount,
            plan,
            status: 'approved',
            createdAt: Timestamp.now(),
        });
    }
}

async function handleAffiliateSale(payload: CaktoWebhookPayload) {
    if (!payload.affiliate_code) return;

    const affiliateSnap = await adminDb
        .collection('affiliates')
        .where('affiliateCode', '==', payload.affiliate_code)
        .limit(1)
        .get();

    if (affiliateSnap.empty) return;

    const affiliateDoc = affiliateSnap.docs[0];
    const commission = payload.amount * 0.3; // 30%

    // Create affiliate sale record
    await adminDb.collection('affiliateSales').add({
        affiliateUid: affiliateDoc.id,
        buyerUid: null, // will be matched later
        plan: normalizePlan(payload.plan),
        saleAmount: payload.amount,
        commission,
        caktoSaleId: payload.sale_id,
        status: 'approved',
        createdAt: Timestamp.now(),
    });

    // Update affiliate totals
    await affiliateDoc.ref.update({
        totalSales: FieldValue.increment(1),
        totalEarnings: FieldValue.increment(commission),
    });
}

function normalizePlan(plan: string): 'starter' | 'pro' | 'annual' {
    const lower = plan.toLowerCase().trim();
    if (lower.includes('annual') || lower.includes('anual')) return 'annual';
    if (lower.includes('pro')) return 'pro';
    return 'starter';
}
