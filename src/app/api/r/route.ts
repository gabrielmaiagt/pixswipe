// ===========================
// Affiliate Redirect — Click Tracking
// GET /api/r?ref=CODE&plan=pro
// ===========================

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
    try {
        const ref = request.nextUrl.searchParams.get('ref');
        const plan = request.nextUrl.searchParams.get('plan') || 'starter';

        if (!ref) {
            // No affiliate code, redirect to pricing
            return NextResponse.redirect(
                new URL('/precos', request.url)
            );
        }

        // Find affiliate by code
        const affiliateSnap = await adminDb
            .collection('affiliates')
            .where('affiliateCode', '==', ref)
            .limit(1)
            .get();

        if (!affiliateSnap.empty) {
            const affiliateDoc = affiliateSnap.docs[0];
            // Increment click counter
            await affiliateDoc.ref.update({
                totalClicks: FieldValue.increment(1),
            });

            // Record the click with timestamp for charts
            await adminDb.collection('affiliateClicks').add({
                affiliateUid: affiliateDoc.id,
                affiliateCode: ref,
                timestamp: FieldValue.serverTimestamp(),
                plan,
                userAgent: request.headers.get('user-agent'),
            });
        }

        // Fetch dynamic settings from Firestore
        const settingsSnap = await adminDb.collection('settings').doc('general').get();
        const settings = settingsSnap.exists ? settingsSnap.data() : {};

        // Build checkout URL with affiliate ref
        const checkoutUrlStarter = settings?.checkoutUrlStarter || process.env.CAKTO_CHECKOUT_URL_STARTER;
        const checkoutUrlPro = settings?.checkoutUrlPro || process.env.CAKTO_CHECKOUT_URL_PRO;
        const checkoutUrlAnnual = settings?.checkoutUrlAnnual || process.env.CAKTO_CHECKOUT_URL_ANNUAL;

        const checkoutUrls: Record<string, string | undefined> = {
            starter: checkoutUrlStarter,
            pro: checkoutUrlPro,
        };

        const checkoutUrl = checkoutUrls[plan] || checkoutUrls.starter;

        if (!checkoutUrl) {
            return NextResponse.redirect(new URL('/precos', request.url));
        }

        const url = new URL(checkoutUrl);
        url.searchParams.set('ref', ref);

        return NextResponse.redirect(url.toString());
    } catch (error) {
        console.error('[Affiliate Redirect] Error:', error);
        return NextResponse.redirect(new URL('/precos', request.url));
    }
}
