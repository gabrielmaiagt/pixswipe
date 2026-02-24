'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import UserForm from '@/components/admin/UserForm';
import type { User } from '@/types';
import styles from '../../admin.module.css';

export default function EditUserPage() {
    const { id } = useParams();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetch() {
            if (!id) return;
            const snap = await getDoc(doc(db, 'users', id as string));
            if (snap.exists()) {
                setUser({ uid: snap.id, ...snap.data() } as User);
            }
            setLoading(false);
        }
        fetch();
    }, [id]);

    if (loading) return <div className="skeleton" style={{ height: 400 }} />;
    if (!user) return <div>Usuário não encontrado</div>;

    return (
        <div>
            <div className={styles.adminHeader}>
                <h1>Editar Usuário: {user.name || user.email}</h1>
            </div>
            <UserForm initialData={user} userId={user.uid} isEditing />
        </div>
    );
}
