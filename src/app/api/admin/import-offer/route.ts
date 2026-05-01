// POST /api/admin/import-offer
// Fetches data from Apify for a given Ad Library URL and returns
// structured data to pre-fill the offer creation form.

import { NextRequest, NextResponse } from 'next/server';
import { extractApifyData } from '@/lib/apify-extractor';

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const ACTOR_ID = 'JJghSZmShuco4j9gJ';

export async function POST(req: NextRequest) {
    try {
        const { adLibraryUrl } = await req.json();
        if (!adLibraryUrl) return NextResponse.json({ error: 'adLibraryUrl é obrigatório' }, { status: 400 });
        if (!APIFY_TOKEN) return NextResponse.json({ error: 'APIFY_TOKEN não configurado' }, { status: 500 });

        // 1. Trigger Apify actor
        const runRes = await fetch(
            `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${APIFY_TOKEN}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startUrls: [{ url: adLibraryUrl }],
                    resultsLimit: 100,
                    activeStatus: 'active',
                }),
            }
        );
        if (!runRes.ok) return NextResponse.json({ error: 'Falha ao iniciar Apify' }, { status: 502 });

        const { data: runData } = await runRes.json();
        const runId = runData.id;
        const datasetId = runData.defaultDatasetId;

        // 2. Poll until finished (up to 90s)
        let finished = false;
        for (let i = 0; i < 18; i++) {
            await new Promise((r) => setTimeout(r, 5000));
            const statusRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`);
            const { data: s } = await statusRes.json();
            if (s.status === 'SUCCEEDED') { finished = true; break; }
            if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(s.status)) {
                return NextResponse.json({ error: `Apify: ${s.status}` }, { status: 502 });
            }
        }
        if (!finished) return NextResponse.json({ error: 'Timeout aguardando Apify' }, { status: 504 });

        // 3. Fetch results
        const itemsRes = await fetch(
            `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}&limit=100`
        );
        const items: any[] = await itemsRes.json();
        if (!items.length) return NextResponse.json({ error: 'Nenhum anúncio encontrado' }, { status: 404 });

        // Tracing
        console.log('[ImportOffer] Raw items count:', items.length);
        console.log('[ImportOffer] First item keys:', Object.keys(items[0]));

        const extracted = extractApifyData(items);

        return NextResponse.json({
            adCount: extracted.adCount,
            pageName: extracted.pageName,
            landingUrls: extracted.landingUrls,
            creatives: extracted.creatives,
            bestAdText: extracted.bestAdText,
            thumbnailUrl: extracted.thumbnailUrl,
        });
    } catch (error: any) {
        console.error('[ImportOffer]', error);
        return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
    }
}
