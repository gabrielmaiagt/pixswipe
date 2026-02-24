'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ModuleForm from '@/components/admin/ModuleForm';
import type { Module } from '@/types';
import styles from '../../admin.module.css';

export default function EditModulePage() {
    const { id } = useParams();
    const [module, setModule] = useState<Module | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetch() {
            if (!id) return;
            const snap = await getDoc(doc(db, 'modules', id as string));
            if (snap.exists()) {
                setModule({ id: snap.id, ...snap.data() } as Module);
            }
            setLoading(false);
        }
        fetch();
    }, [id]);

    if (loading) return <div className="skeleton" style={{ height: 400 }} />;
    if (!module) return <div>Módulo não encontrado</div>;

    return (
        <div>
            <div className={styles.adminHeader}>
                <h1>Editar Módulo: {module.title}</h1>
            </div>
            <ModuleForm initialData={module} moduleId={module.id} isEditing />
        </div>
    );
}
