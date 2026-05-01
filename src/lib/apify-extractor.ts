// Shared Apify data extractor for Facebook Ad Library results
// Handles various nested structures returned by multiple actors (JJghSZmShuco4j9gJ, etc.)

import { AdCreative } from '@/types';

export interface ApifyAdResult {
    adCount: number;
    creatives: AdCreative[];    // images and videos with counts
    landingUrls: string[];      // CTA/link URLs from ads
    pageName: string;
    bestAdText: string;
    thumbnailUrl: string;
    rawItems: any[];
}

export function extractApifyData(rawItems: any[]): ApifyAdResult {
    // 1. IMPROVED Flattening: Some actors return a list of ads, others return 1 item with nested ads.
    // We recursively look for the largest array in the structure if rawItems is small.
    let items: any[] = [];

    const findLargestArray = (obj: any): any[] => {
        if (!obj || typeof obj !== 'object') return [];
        let largest: any[] = Array.isArray(obj) ? obj : [];

        for (const key in obj) {
            // Skip common non-ad arrays that might be larger than 0
            if (['activeIssues', 'relatedPages', 'menuItems'].includes(key)) continue;

            if (Array.isArray(obj[key])) {
                // If we find an array called 'results' or 'ads' and it has items, 
                // it's almost certainly what we want even if not the "largest"
                if ((key === 'results' || key === 'ads') && obj[key].length > 0) {
                    return obj[key];
                }
                if (obj[key].length > largest.length) {
                    largest = obj[key];
                }
            } else if (typeof obj[key] === 'object') {
                const nested = findLargestArray(obj[key]);
                if (nested.length > largest.length) {
                    largest = nested;
                }
            }
        }
        return largest;
    };

    if (rawItems.length === 1 && !rawItems[0].snapshot && !rawItems[0].ad_creative_body) {
        // Likely a wrapper object, find the actual ads array
        items = findLargestArray(rawItems[0]);
    } else {
        // Fallback to legacy flattening
        for (const raw of rawItems) {
            if (Array.isArray(raw.ads) && raw.ads.length > 0) {
                items.push(...raw.ads);
            } else if (Array.isArray(raw.results) && raw.results.length > 0) {
                items.push(...raw.results);
            } else if (Array.isArray(raw.data) && raw.data.length > 0) {
                items.push(...raw.data);
            } else if (!raw.results && !raw.ads) {
                items.push(raw);
            }
        }
    }

    // Secondary check: if we still have only 1 item and it has a known ads field, use it
    if (items.length === 1) {
        const single = items[0];
        const nestedAds = single.ads || single.results || single.items || (single.data && single.data.ads);
        if (Array.isArray(nestedAds)) {
            items = nestedAds;
        }
    }

    // Process every item (removing restrictive filter that might skip valid ads)
    const adCount = items.length;
    const landingUrls: string[] = [];
    const adTexts: string[] = [];
    let pageName = '';

    // Map to count occurrences of each URL
    const creativeMap = new Map<string, { count: number, type: 'image' | 'video', originalUrl: string }>();

    for (const item of items) {
        if (!pageName) {
            pageName = item.pageName || item.page_name || item.advertiserName ||
                item.pageAlias || item.page?.name || '';
        }

        const snap = item.snapshot || item.adSnapshot || item;
        const adUrls = new Set<string>();

        // Targeted Media Extraction
        const isMediaString = (str: any) => typeof str === 'string' && str.startsWith('http') && (str.includes('fbcdn.net') || str.includes('fbcdn.com'));

        const extractFromObj = (obj: any) => {
            if (!obj) return;

            // Videos: prioritize HD over SD to avoid getting both formats
            if (Array.isArray(obj.videos)) {
                for (const v of obj.videos) {
                    const vidUrl = v.video_hd_url || v.videoHdUrl || v.video_sd_url || v.videoSdUrl;
                    if (isMediaString(vidUrl)) adUrls.add(vidUrl);
                }
            } else if (obj.video_hd_url || obj.videoHdUrl || obj.video_sd_url || obj.videoSdUrl) {
                const vidUrl = obj.video_hd_url || obj.videoHdUrl || obj.video_sd_url || obj.videoSdUrl;
                if (isMediaString(vidUrl)) adUrls.add(vidUrl);
            }

            // Images: prioritize original to avoid getting resized versions
            if (Array.isArray(obj.images)) {
                for (const i of obj.images) {
                    const imgUrl = i.original_image_url || i.originalImageUrl || i.image_url || i.imageUrl;
                    if (isMediaString(imgUrl)) adUrls.add(imgUrl);
                }
            } else if (obj.original_image_url || obj.originalImageUrl || obj.image_url || obj.imageUrl) {
                const imgUrl = obj.original_image_url || obj.originalImageUrl || obj.image_url || obj.imageUrl;
                if (isMediaString(imgUrl)) adUrls.add(imgUrl);
            }

            // Carousel Cards
            if (Array.isArray(obj.cards)) {
                for (const c of obj.cards) {
                    const vidUrl = c.video_hd_url || c.videoHdUrl || c.video_sd_url || c.videoSdUrl;
                    const imgUrl = c.original_image_url || c.originalImageUrl || c.image_url || c.imageUrl;

                    if (isMediaString(vidUrl)) adUrls.add(vidUrl);
                    else if (isMediaString(imgUrl)) adUrls.add(imgUrl);
                }
            }
        };

        extractFromObj(snap);
        if (item !== snap) extractFromObj(item);

        // Fallbacks that Apify sometimes leaves at the root
        if (isMediaString(item.ad_creative_video_url)) adUrls.add(item.ad_creative_video_url);
        else if (isMediaString(item.ad_creative_image_url)) adUrls.add(item.ad_creative_image_url);

        // Process collected URLs for this ad, grouping them smartly
        for (const url of adUrls) {
            // Filter out unplayable DASH streams and initialization segments
            if (url.includes('dashinit') || url.includes('bytestart=')) continue;

            // Enhanced video detection: Look for strict video domains or extensions
            const isVideo = !!url.match(/\.(mp4|webm|mov|m4v)/i) ||
                url.includes('video-') ||
                url.includes('video.xx');

            // Unique ID extraction for flawless deduplication
            let uniqueId = url;
            try {
                const urlObj = new URL(url);
                const pathParts = urlObj.pathname.split('/');
                const filename = pathParts[pathParts.length - 1];

                if (filename) {
                    const match = filename.match(/_(\d+)_n\.(jpg|png|mp4)/);
                    if (match) {
                        uniqueId = match[1];
                    } else {
                        uniqueId = filename;
                    }
                }
            } catch (e) {
                uniqueId = url.split('?')[0];
            }

            const existing = creativeMap.get(uniqueId);
            if (existing) {
                existing.count++;
            } else {
                creativeMap.set(uniqueId, { count: 1, type: isVideo ? 'video' : 'image', originalUrl: url });
            }
        }

        // ── Landing URLs ──
        const link = snap.link_url || snap.linkUrl || snap.cta_link || snap.ctaLink ||
            item.link_url || item.linkUrl || item.landingPageUrl || item.landing_page_url;
        addUniqueString(landingUrls, link);

        // ── Ad text ──
        const text =
            snap.body?.text ||
            snap.body?.markup?.__html ||
            snap.title ||
            snap.caption ||
            item.ad_creative_body ||
            item.bodyText ||
            item.body ||
            item.text || '';
        if (text && typeof text === 'string' && text.length > 5) {
            adTexts.push(text.replace(/<[^>]+>/g, '').trim());
        }
    }

    const creatives: AdCreative[] = Array.from(creativeMap.entries())
        .map(([url, data]) => ({
            url: data.originalUrl || url,
            count: data.count,
            type: data.type
        }))
        .sort((a, b) => b.count - a.count);

    const bestAdText = adTexts.sort((a, b) => b.length - a.length)[0] || '';
    const thumbnailUrl = creatives.find(c => c.type === 'image')?.url || creatives[0]?.url || '';

    return { adCount, creatives, landingUrls, pageName, bestAdText, thumbnailUrl, rawItems: items };
}

function addUniqueString(arr: string[], val: string | null | undefined) {
    if (val && typeof val === 'string' && val.startsWith('http') && !arr.includes(val)) {
        arr.push(val);
    }
}
