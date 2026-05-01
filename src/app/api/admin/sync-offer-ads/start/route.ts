import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const ACTOR_ID = 'JJghSZmShuco4j9gJ';

function logTrace(msg: string) {
    try {
        const logPath = path.join(process.cwd(), 'public', 'sync_trace.txt');
        const timestamp = new Date().toISOString();
        fs.appendFileSync(logPath, `[${timestamp}] ${msg}\n`);
    } catch (e) {
        console.error('Failed to write log:', e);
    }
}

export async function POST(req: Request) {
    logTrace('--- NEW SYNC ATTEMPT ---');
    try {
        const APIFY_TOKEN = process.env.APIFY_TOKEN;
        if (!APIFY_TOKEN) {
            logTrace('Error: APIFY_TOKEN missing');
            return NextResponse.json({ error: 'APIFY_TOKEN não configurado no .env.local' }, { status: 500 });
        }

        const body = await req.json();
        const { offerId } = body;
        logTrace(`Request body: ${JSON.stringify(body)}`);

        if (!offerId) {
            logTrace('Error: No offerId provided');
            return NextResponse.json({ error: 'ID da oferta não fornecido' }, { status: 400 });
        }

        // 1. Get Offer from Firestore
        logTrace(`Fetching offer from Firestore: ${offerId}`);
        const offerSnap = await adminDb.collection('offers').doc(offerId).get();

        if (!offerSnap.exists) {
            logTrace(`Error: Offer ${offerId} not found in Firestore`);
            return NextResponse.json({ error: 'Oferta não encontrada no banco de dados' }, { status: 404 });
        }

        const offer = offerSnap.data()!;
        let urlToCheck = offer.adLibraryUrl || offer.facebookUrl;

        if (!urlToCheck) {
            logTrace('Error: Ad Library URL is empty');
            return NextResponse.json({ error: 'Oferta sem URL de biblioteca de anúncios' }, { status: 400 });
        }

        // Simplify URL and extract Page ID if possible
        const pageIdMatch = urlToCheck.match(/view_all_page_id=(\d+)/);
        let pageId = null;

        if (pageIdMatch) {
            pageId = pageIdMatch[1];
            logTrace(`Extracted Page ID: ${pageId}. Using direct page search.`);
        }

        // 2. Start Apify Actor
        logTrace(`Starting Deep Page Search for Page ID: ${pageId || 'N/A'}`);
        const runRes = await fetch(`https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${APIFY_TOKEN}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                // Using the most robust combination: URL + explicit PageID + searchType
                startUrls: [{ url: `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&view_all_page_id=${pageId || ''}` }],
                pageID: pageId,
                searchType: "page",
                activeStatus: "active",
                country: "BR",
                resultsLimit: 200,
                proxyConfiguration: {
                    useApifyProxy: true
                }
            })
        });

        const resJson = await runRes.json().catch(() => null);
        logTrace(`Apify Response Status: ${runRes.status}`);
        logTrace(`Apify Response Body: ${JSON.stringify(resJson)}`);

        if (!runRes.ok) {
            const errBody = resJson ? JSON.stringify(resJson) : 'No JSON body';
            return NextResponse.json({ error: `Apify Falhou (${runRes.status}): ${errBody}` }, { status: runRes.status });
        }

        const runId = resJson.data.id;
        const datasetId = resJson.data.defaultDatasetId;
        logTrace(`Sync started successfully. RunID: ${runId}, DatasetID: ${datasetId}`);

        return NextResponse.json({
            success: true,
            runId,
            datasetId,
            msg: 'Sincronização iniciada no Apify'
        });

    } catch (error: any) {
        logTrace(`CRITICAL ERROR in POST: ${error.message}`);
        console.error('Error starting sync:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
