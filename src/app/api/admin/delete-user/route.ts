import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

export async function DELETE(req: Request) {
    try {
        const { uid } = await req.json();

        if (!uid) {
            return NextResponse.json({ error: 'UID é obrigatório.' }, { status: 400 });
        }

        const auth = getAdminAuth();
        const db = getAdminDb();

        // 1. Delete from Firebase Auth
        try {
            await auth.deleteUser(uid);
        } catch (authErr: any) {
            // If user doesn't exist in Auth, continue to delete Firestore doc
            if (authErr.code !== 'auth/user-not-found') throw authErr;
        }

        // 2. Delete Firestore document
        await db.collection('users').doc(uid).delete();

        return NextResponse.json({ success: true, message: 'Usuário excluído com sucesso.' });

    } catch (error: any) {
        console.error('[Admin Delete User Error]:', error);
        return NextResponse.json(
            { error: error.message || 'Erro ao excluir usuário.' },
            { status: 500 }
        );
    }
}
