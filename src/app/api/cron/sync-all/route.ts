import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://pix-swipe.vercel.app'; // Fallback if needed
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
    const authHeader = request.headers.get('Authorization');

    // 1. Security Check
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log('[Cron] Starting Daily Sync for all offers...');

        // 2. Fetch all offers with Ad Library URL
        const offersSnap = await adminDb.collection('offers')
            .where('adLibraryUrl', '!=', '')
            .get();

        if (offersSnap.empty) {
            return NextResponse.json({ message: 'No offers to sync' });
        }

        const triggered = [];

        // 3. Trigger Apify Actor for each offer
        for (const doc of offersSnap.docs) {
            const offer = doc.data();
            const offerId = doc.id;

            console.log(`[Cron] Triggering sync for offer: ${offer.title} (${offerId})`);

            const apifyUrl = `https://api.apify.com/v2/acts/JJghSZmShuco4j9gJ/runs?token=${APIFY_TOKEN}`;

            // Trigger actor WITH webhook payload
            const response = await fetch(apifyUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    "startUrls": [{ "url": offer.adLibraryUrl }],
                    "maxAds": 500,
                    "limit": 500,
                    "resultsLimit": 500,
                    "webhooks": [
                        {
                            "eventTypes": ["ACTOR.RUN.SUCCEEDED"],
                            "requestUrl": `${APP_URL}/api/webhooks/apify-complete?offerId=${offerId}`,
                            "payloadTemplate": "{\n    \"runId\": {{resource.id}},\n    \"offerId\": \"{{offerId}}\"\n}"
                        }
                    ]
                })
            });

            if (response.ok) {
                triggered.push(offerId);
            } else {
                console.error(`[Cron] Failed to trigger ${offerId}:`, await response.text());
            }
        }

        return NextResponse.json({
            success: true,
            triggeredCount: triggered.length,
            offers: triggered
        });

    } catch (error: any) {
        console.error('[Cron Error]:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
