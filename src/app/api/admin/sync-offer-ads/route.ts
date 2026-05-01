// POST /api/admin/sync-offer-ads
// Calls Apify to scrape the offer's ad library URL and saves a daily snapshot.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const ACTOR_ID = 'JJghSZmShuco4j9gJ';

export async function POST(req: NextRequest) {
    try {
        const { offerId } = await req.json();

        if (!offerId) {
            return NextResponse.json({ error: 'offerId é obrigatório' }, { status: 400 });
        }
        if (!APIFY_TOKEN) {
            return NextResponse.json({ error: 'APIFY_TOKEN não configurado' }, { status: 500 });
        }

        // 1. Get offer to find adLibraryUrl
        const offerSnap = await adminDb.collection('offers').doc(offerId).get();
        if (!offerSnap.exists) {
            return NextResponse.json({ error: 'Oferta não encontrada' }, { status: 404 });
        }

        const offer = offerSnap.data()!;
        const adLibraryUrl = offer.adLibraryUrl;

        if (!adLibraryUrl) {
            return NextResponse.json({ error: 'Oferta sem URL de biblioteca de anúncios' }, { status: 400 });
        }

        // 2. Trigger Apify actor
        const runRes = await fetch(
            `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${APIFY_TOKEN}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startUrls: [{ url: adLibraryUrl }],
                    resultsLimit: 50,
                    activeStatus: 'active',
                }),
            }
        );

        if (!runRes.ok) {
            const err = await runRes.text();
            console.error('[Apify] Run failed:', err);
            return NextResponse.json({ error: 'Falha ao iniciar actor Apify' }, { status: 502 });
        }

        const { data: runData } = await runRes.json();
        const runId = runData.id;
        const datasetId = runData.defaultDatasetId;

        // 3. Wait for actor to finish (poll up to 90s)
        let finished = false;
        for (let i = 0; i < 18; i++) {
            await new Promise((r) => setTimeout(r, 5000));
            const statusRes = await fetch(
                `https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`
            );
            const { data: statusData } = await statusRes.json();
            if (statusData.status === 'SUCCEEDED') {
                finished = true;
                break;
            }
            if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(statusData.status)) {
                return NextResponse.json({ error: `Actor terminou com status: ${statusData.status}` }, { status: 502 });
            }
        }

        if (!finished) {
            return NextResponse.json({ error: 'Timeout aguardando Apify' }, { status: 504 });
        }

        // 4. Fetch results
        const itemsRes = await fetch(
            `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}&limit=50`
        );
        const items: any[] = await itemsRes.json();

        const adCount = items.length;
        const creativeUrls: string[] = [];

        for (const item of items) {
            // Try to extract image/video URLs from various Apify output fields
            const snapshot = item.snapshot || item.imageUrl || item.image || null;
            const video = item.videoUrl || item.video || null;
            if (snapshot && typeof snapshot === 'string') creativeUrls.push(snapshot);
            if (video && typeof video === 'string') creativeUrls.push(video);
        }

        // 5. Write daily snapshot to Firestore
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const snapshotRef = adminDb
            .collection('offers')
            .doc(offerId)
            .collection('adSnapshots')
            .doc(today);

        await snapshotRef.set({
            adCount,
            creativeUrls,
            scrapedAt: Timestamp.now(),
        });

        // 6. Update offer with latest count + sync time
        await adminDb.collection('offers').doc(offerId).update({
            lastAdCount: adCount,
            lastSyncedAt: Timestamp.now(),
        });

        return NextResponse.json({
            success: true,
            adCount,
            creativesFound: creativeUrls.length,
            snapshotDate: today,
        });
    } catch (error: any) {
        console.error('[SyncOfferAds]', error);
        return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
    }
}
