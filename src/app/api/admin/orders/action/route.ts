import { NextRequest, NextResponse } from 'next/server';
import { caktoClient } from '@/lib/cakto-api';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
    try {
        const { action, orderId } = await request.json();

        if (!orderId) {
            return NextResponse.json({ error: 'ID da ordem é obrigatório' }, { status: 400 });
        }

        switch (action) {
            case 'refund':
                await caktoClient.refundOrder(orderId);

                // We should also find the payment in Firestore and mark it as refunded
                // Note: The webhook will also do this, but doing it here provides immediate feedback
                const paymentSnap = await adminDb.collection('payments')
                    .where('caktoSaleId', '==', orderId)
                    .limit(1)
                    .get();

                if (!paymentSnap.empty) {
                    const paymentDoc = paymentSnap.docs[0];
                    await paymentDoc.ref.update({
                        status: 'refunded',
                        updatedAt: Timestamp.now()
                    });

                    // Also revoke user plan
                    const uid = paymentDoc.data().uid;
                    if (uid) {
                        await adminDb.collection('users').doc(uid).update({
                            entitlementStatus: 'inactive',
                            plan: null
                        });
                    }
                }

                return NextResponse.json({ success: true, message: 'Estorno solicitado' });

            case 'resend':
                await caktoClient.resendAccess(orderId);
                return NextResponse.json({ success: true, message: 'Acesso reenviado' });

            default:
                return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
        }
    } catch (error: any) {
        console.error('Admin Order Action Error:', error);
        return NextResponse.json({
            error: error.message || 'Erro ao processar ação'
        }, { status: 500 });
    }
}
