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
            // Increment click counter
            await affiliateSnap.docs[0].ref.update({
                totalClicks: FieldValue.increment(1),
            });
        }

        // Build checkout URL with affiliate ref
        const checkoutUrls: Record<string, string | undefined> = {
            starter: process.env.CAKTO_CHECKOUT_URL_STARTER,
            pro: process.env.CAKTO_CHECKOUT_URL_PRO,
            annual: process.env.CAKTO_CHECKOUT_URL_ANNUAL,
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
