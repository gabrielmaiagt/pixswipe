import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { extractApifyData } from '@/lib/apify-extractor';
import fs from 'fs';
import path from 'path';

const APIFY_TOKEN = process.env.APIFY_TOKEN;

function logTrace(msg: string) {
    try {
        const logPath = path.join(process.cwd(), 'public', 'sync_trace.txt');
        const timestamp = new Date().toISOString();
        fs.appendFileSync(logPath, `[${timestamp}] [POLL] ${msg}\n`);
    } catch (e) {
        console.error('Failed to write log:', e);
    }
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const runId = searchParams.get('runId');
    const datasetId = searchParams.get('datasetId');
    const offerId = searchParams.get('offerId');

    logTrace(`Poll request: runId=${runId}, datasetId=${datasetId}, offerId=${offerId}`);

    if (!runId || !datasetId || !offerId) {
        logTrace('Error: Missing params in poll');
        return NextResponse.json({ error: 'Missing params (runId, datasetId, offerId)' }, { status: 400 });
    }

    try {
        // 1. Check if run is finished
        const runRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`);
        const runData = await runRes.json();

        const status = runData?.data?.status;
        logTrace(`Apify Run Status: ${status}`);

        if (status !== 'SUCCEEDED') {
            return NextResponse.json({ status });
        }

        // 2. Run finished! Get dataset items
        logTrace(`Fetching dataset items: ${datasetId}`);
        const itemsRes = await fetch(
            `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}&limit=500`
        );
        const items: any[] = await itemsRes.json();
        logTrace(`Received ${items.length} raw items from dataset`);

        if (items.length > 0) {
            logTrace(`First item keys: ${Object.keys(items[0]).join(', ')}`);
            logTrace(`First item sample: ${JSON.stringify(items[0]).slice(0, 500)}`);

            // Check if it's an error item from Apify
            if (items.length === 1 && items[0].error) {
                const errMsg = items[0].errorDescription || items[0].error;
                logTrace(`Apify reported error in dataset: ${errMsg}`);
                return NextResponse.json({
                    status: 'FAILED',
                    error: `Apify: ${errMsg}`
                });
            }
        }

        // Use the shared robust extractor
        const result = extractApifyData(items);
        logTrace(`Extracted result: adCount=${result.adCount}, creativeCount=${result.creatives.length}`);

        if (result.adCount > 0 && result.creatives.length === 0) {
            logTrace(`Warning: Found ${result.adCount} ads but 0 creatives. Item[0] results keys: ${items[0].results ? Object.keys(items[0].results[0] || {}).join(', ') : 'N/A'}`);
            if (items[0].results && items[0].results[0]) {
                logTrace(`Deep sample of results[0]: ${JSON.stringify(items[0].results[0]).slice(0, 1000)}`);
            }
        }

        const today = new Date().toISOString().split('T')[0];
        const offerRef = adminDb.collection('offers').doc(offerId);
        const offerSnap = await offerRef.get();
        const offerTitle = offerSnap.exists ? (offerSnap.data()?.title || 'Oferta s/ título') : 'Oferta não encontrada';

        // 1. Update the offer's latest sync snapshot
        logTrace(`Saving snapshot to Firestore for date ${today}`);
        await adminDb.collection('offers').doc(offerId).collection('adSnapshots').doc(today).set({
            adCount: result.adCount,
            creativeCount: result.creatives.length,
            creatives: result.creatives,
            landingUrls: result.landingUrls,
            bestAdText: result.bestAdText,
            thumbnailUrl: result.thumbnailUrl,
            debugRawItems: items.length,
            scrapedAt: Timestamp.now(),
        });

        // 2. Save global log
        await adminDb.collection('adminSyncLogs').add({
            offerId,
            offerTitle,
            adCount: result.adCount,
            creativeCount: result.creatives.length,
            rawItemCount: items.length,
            scrapedAt: Timestamp.now(),
            date: today
        });

        // 3. Update main offer doc
        await offerRef.update({
            lastAdCount: result.adCount,
            lastSyncedAt: Timestamp.now(),
            thumbnailUrl: result.thumbnailUrl || offerSnap.data()?.thumbnailUrl || ""
        });

        logTrace('Sync process completed successfully');

        return NextResponse.json({
            status: 'FINISHED',
            adCount: result.adCount,
            creativeCount: result.creatives.length,
            rawItemCount: items.length
        });

    } catch (err: any) {
        logTrace(`CRITICAL ERROR in POLL: ${err.message}`);
        console.error('[Apify Poll Error]:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
