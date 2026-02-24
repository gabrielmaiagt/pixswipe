'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, GraduationCap } from 'lucide-react';
import { collection, getDocs, deleteDoc, doc, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { StatusBadge } from '@/components/ui/Badge';
import { formatDuration } from '@/lib/utils';
import Button from '@/components/ui/Button';
import type { Lesson } from '@/types';
import toast from 'react-hot-toast';
import styles from '../admin.module.css';

export default function AdminAulas() {
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetch() {
            const snap = await getDocs(query(collection(db, 'lessons'), orderBy('order', 'asc')));
            setLessons(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Lesson)));
            setLoading(false);
        }
        fetch();
    }, []);

    async function handleDelete(id: string) {
        if (!confirm('Deletar esta aula permanentemente?')) return;
        await deleteDoc(doc(db, 'lessons', id));
        setLessons((prev) => prev.filter((l) => l.id !== id));
        toast.success('Aula deletada');
    }

    return (
        <div>
            <div className={styles.adminHeader}>
                <h1>Aulas</h1>
                <Button icon={<Plus size={16} />}>Nova aula</Button>
            </div>

            {loading ? (
                <div className={styles.kpiGrid}>
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="skeleton" style={{ height: 60, borderRadius: 8 }} />
                    ))}
                </div>
            ) : lessons.length === 0 ? (
                <div className={styles.emptyAdmin}>
                    <GraduationCap size={48} />
                    <p>Nenhuma aula criada</p>
                </div>
            ) : (
                <table className={styles.dataTable}>
                    <thead>
                        <tr>
                            <th>Título</th>
                            <th>Módulo</th>
                            <th>Duração</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {lessons.map((lesson) => (
                            <tr key={lesson.id}>
                                <td style={{ fontWeight: 600 }}>{lesson.title}</td>
                                <td style={{ color: 'var(--text-muted)' }}>{lesson.moduleId}</td>
                                <td>{formatDuration(lesson.duration)}</td>
                                <td><StatusBadge status={lesson.status} /></td>
                                <td>
                                    <div className={styles.tableActions}>
                                        <button className={styles.editBtn}><Edit size={12} /> Editar</button>
                                        <button className={styles.deleteBtn} onClick={() => handleDelete(lesson.id)}>
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
