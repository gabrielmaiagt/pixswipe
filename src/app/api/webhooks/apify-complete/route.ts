import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { extractApifyData } from '@/lib/apify-extractor';
import { Timestamp } from 'firebase-admin/firestore';

const APIFY_TOKEN = process.env.APIFY_TOKEN;

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { runId, offerId } = body;

        if (!runId || !offerId) {
            console.error('[Apify Webhook] Missing runId or offerId:', body);
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        console.log(`[Apify Webhook] Processing run ${runId} for offer ${offerId}`);

        // 1. Fetch results from Apify
        const resultsUrl = `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${APIFY_TOKEN}`;
        const response = await fetch(resultsUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch Apify results: ${response.statusText}`);
        }

        const items = await response.json();
        console.log(`[Apify Webhook] Received ${items.length} raw items`);

        // 2. Extract and parse
        const extracted = extractApifyData(items);
        const today = new Date().toISOString().split('T')[0];

        const offerRef = adminDb.collection('offers').doc(offerId);
        const offerSnap = await offerRef.get();
        const offerTitle = offerSnap.exists ? (offerSnap.data()?.title || 'Oferta s/ título') : 'Oferta não encontrada';

        // 3. Save snapshot (For the offer page chart/gallery)
        await offerRef.collection('adSnapshots').doc(today).set({
            adCount: extracted.adCount,
            creatives: extracted.creatives,
            landingUrls: extracted.landingUrls,
            debugRawItems: items.length,
            scrapedAt: Timestamp.now(),
        });

        // 4. Update offer main stats
        await offerRef.update({
            lastAdCount: extracted.adCount,
            lastSyncedAt: Timestamp.now(),
        });

        // 5. Save global admin log
        await adminDb.collection('adminSyncLogs').add({
            offerId,
            offerTitle,
            adCount: extracted.adCount,
            creativesCount: extracted.creatives.length,
            debugRawItems: items.length,
            date: today,
            timestamp: Timestamp.now(),
            source: 'webhook'
        });

        console.log(`[Apify Webhook] Successfully processed sync for ${offerTitle}`);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('[Apify Webhook Error]:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
