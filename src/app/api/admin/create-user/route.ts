import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, password, role, plan, entitlementStatus, currentPeriodEnd } = body;

        if (!email || !password || !name) {
            return NextResponse.json({ error: 'Nome, E-mail e Senha são obrigatórios.' }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres.' }, { status: 400 });
        }

        const auth = getAdminAuth();
        const db = getAdminDb();

        // 1. Create user in Firebase Auth
        const userRecord = await auth.createUser({
            email,
            password,
            displayName: name,
        });

        // 2. Create user document in Firestore
        const userData = {
            name,
            email,
            role: role || 'user',
            plan: plan || 'starter',
            entitlementStatus: entitlementStatus || 'active',
            currentPeriodEnd: currentPeriodEnd ? Timestamp.fromDate(new Date(currentPeriodEnd)) : Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            onboardingCompleted: false,
            totalSwipes: 0,
            balance: 0,
        };

        await db.collection('users').doc(userRecord.uid).set(userData);

        return NextResponse.json({
            success: true,
            uid: userRecord.uid,
            message: 'Usuário criado com sucesso no Auth e Firestore.'
        });

    } catch (error: any) {
        console.error('[Admin Create User Error]:', error);

        if (error.code === 'auth/email-already-exists') {
            return NextResponse.json({ error: 'Este e-mail já está em uso.' }, { status: 400 });
        }

        return NextResponse.json({
            error: error.message || 'Erro ao criar usuário.'
        }, { status: 500 });
    }
}
