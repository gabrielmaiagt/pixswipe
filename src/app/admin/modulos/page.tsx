'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, BookOpen } from 'lucide-react';
import { collection, getDocs, deleteDoc, doc, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { StatusBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import type { Module } from '@/types';
import toast from 'react-hot-toast';
import styles from '../admin.module.css';

export default function AdminModulos() {
    const [modules, setModules] = useState<Module[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetch() {
            const snap = await getDocs(query(collection(db, 'modules'), orderBy('order', 'asc')));
            setModules(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Module)));
            setLoading(false);
        }
        fetch();
    }, []);

    async function handleDelete(id: string) {
        if (!confirm('Deletar este módulo permanentemente?')) return;
        await deleteDoc(doc(db, 'modules', id));
        setModules((prev) => prev.filter((m) => m.id !== id));
        toast.success('Módulo deletado');
    }

    return (
        <div>
            <div className={styles.adminHeader}>
                <h1>Módulos</h1>
                <Button icon={<Plus size={16} />}>Novo módulo</Button>
            </div>

            {loading ? (
                <div className={styles.kpiGrid}>
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="skeleton" style={{ height: 60, borderRadius: 8 }} />
                    ))}
                </div>
            ) : modules.length === 0 ? (
                <div className={styles.emptyAdmin}>
                    <BookOpen size={48} />
                    <p>Nenhum módulo criado</p>
                </div>
            ) : (
                <table className={styles.dataTable}>
                    <thead>
                        <tr>
                            <th>Ordem</th>
                            <th>Título</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {modules.map((mod) => (
                            <tr key={mod.id}>
                                <td>#{mod.order}</td>
                                <td style={{ fontWeight: 600 }}>{mod.title}</td>
                                <td><StatusBadge status={mod.status} /></td>
                                <td>
                                    <div className={styles.tableActions}>
                                        <button className={styles.editBtn}><Edit size={12} /> Editar</button>
                                        <button className={styles.deleteBtn} onClick={() => handleDelete(mod.id)}>
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
