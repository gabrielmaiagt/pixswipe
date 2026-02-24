'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import LessonForm from '@/components/admin/LessonForm';
import type { Lesson } from '@/types';
import styles from '../../admin.module.css';

export default function EditLessonPage() {
    const { id } = useParams();
    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetch() {
            if (!id) return;
            const snap = await getDoc(doc(db, 'lessons', id as string));
            if (snap.exists()) {
                setLesson({ id: snap.id, ...snap.data() } as Lesson);
            }
            setLoading(false);
        }
        fetch();
    }, [id]);

    if (loading) return <div className="skeleton" style={{ height: 400 }} />;
    if (!lesson) return <div>Aula não encontrada</div>;

    return (
        <div>
            <div className={styles.adminHeader}>
                <h1>Editar Aula: {lesson.title}</h1>
            </div>
            <LessonForm initialData={lesson} lessonId={lesson.id} isEditing />
        </div>
    );
}
