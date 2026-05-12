'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, BookOpen, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { collection, getDocs, deleteDoc, doc, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { StatusBadge } from '@/components/ui/Badge';
import { formatDuration } from '@/lib/utils';
import Button from '@/components/ui/Button';
import type { Module, Lesson } from '@/types';
import toast from 'react-hot-toast';
import styles from '../admin.module.css';

export default function AdminModulos() {
    const [modules, setModules] = useState<Module[]>([]);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetch() {
            try {
                const modSnap = await getDocs(query(collection(db, 'modules'), orderBy('order', 'asc')));
                setModules(modSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Module)));

                const lesSnap = await getDocs(query(collection(db, 'lessons'), orderBy('order', 'asc')));
                setLessons(lesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Lesson)));
            } catch (err) {
                console.error('Fetch error:', err);
            } finally {
                setLoading(false);
            }
        }
        fetch();
    }, []);

    async function handleDeleteModule(id: string) {
        if (!confirm('Deletar este módulo permanentemente?')) return;
        await deleteDoc(doc(db, 'modules', id));
        setModules((prev) => prev.filter((m) => m.id !== id));
        toast.success('Módulo deletado');
    }

    async function handleDeleteLesson(id: string) {
        if (!confirm('Deletar esta aula permanentemente?')) return;
        await deleteDoc(doc(db, 'lessons', id));
        setLessons((prev) => prev.filter((l) => l.id !== id));
        toast.success('Aula deletada');
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            {/* --- Módulos --- */}
            <div>
                <div className={styles.adminHeader}>
                    <h1><BookOpen size={24} /> Módulos</h1>
                    <Link href="/admin/modulos/novo">
                        <Button icon={<Plus size={16} />}>Novo módulo</Button>
                    </Link>
                </div>

                {loading ? (
                    <div className="skeleton" style={{ height: 100 }} />
                ) : modules.length === 0 ? (
                    <div className={styles.emptyAdmin}>
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
                                            <Link href={`/admin/modulos/${mod.id}`}>
                                                <button className={styles.editBtn}><Edit size={12} /> Editar</button>
                                            </Link>
                                            <button className={styles.deleteBtn} onClick={() => handleDeleteModule(mod.id)}>
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

            {/* --- Aulas --- */}
            <div>
                <div className={styles.adminHeader}>
                    <h1><GraduationCap size={24} /> Aulas</h1>
                    <Link href="/admin/aulas/nova">
                        <Button icon={<Plus size={16} />} variant="secondary">Nova aula</Button>
                    </Link>
                </div>

                {loading ? (
                    <div className="skeleton" style={{ height: 100 }} />
                ) : lessons.length === 0 ? (
                    <div className={styles.emptyAdmin}>
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
                                    <td style={{ color: 'var(--text-muted)' }}>
                                        {modules.find(m => m.id === lesson.moduleId)?.title || 'Módulo não encontrado'}
                                    </td>
                                    <td>{formatDuration(lesson.duration)}</td>
                                    <td><StatusBadge status={lesson.status} /></td>
                                    <td>
                                        <div className={styles.tableActions}>
                                            <Link href={`/admin/aulas/${lesson.id}`}>
                                                <button className={styles.editBtn}><Edit size={12} /> Editar</button>
                                            </Link>
                                            <button className={styles.deleteBtn} onClick={() => handleDeleteLesson(lesson.id)}>
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
        </div>
    );
}
