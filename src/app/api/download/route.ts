// ===========================
// Download API — Signed URL Generator
// GET /api/download?path=creatives/xxx.jpg
// ===========================

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, adminStorage } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
    try {
        // Verify auth
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Não autorizado' },
                { status: 401 }
            );
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await adminAuth.verifyIdToken(token);
        const uid = decodedToken.uid;

        // Check entitlement
        const userDoc = await adminDb.collection('users').doc(uid).get();
        if (!userDoc.exists) {
            return NextResponse.json(
                { error: 'Usuário não encontrado' },
                { status: 404 }
            );
        }

        const userData = userDoc.data();
        if (userData?.entitlementStatus !== 'active') {
            return NextResponse.json(
                { error: 'Assinatura não ativa' },
                { status: 403 }
            );
        }

        // Get storage path
        const storagePath = request.nextUrl.searchParams.get('path');
        if (!storagePath) {
            return NextResponse.json(
                { error: 'Caminho do arquivo não fornecido' },
                { status: 400 }
            );
        }

        // Generate signed URL (1 hour expiry)
        const bucket = adminStorage.bucket();
        const file = bucket.file(storagePath);

        const [url] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 60 * 60 * 1000, // 1 hour
        });

        return NextResponse.json({ url });
    } catch (error: unknown) {
        console.error('[Download] Error:', error);
        return NextResponse.json(
            { error: 'Erro ao gerar link de download' },
            { status: 500 }
        );
    }
}
