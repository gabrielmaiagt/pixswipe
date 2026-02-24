'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Play, Clock } from 'lucide-react';
import {
    doc,
    getDoc,
    collection,
    getDocs,
    query,
    orderBy,
    where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import type { Module, Lesson, LessonProgress } from '@/types';
import styles from '../aulas.module.css';

export default function ModuleDetailPage({
    params,
}: {
    params: Promise<{ moduleId: string }>;
}) {
    const { moduleId } = use(params);
    const { firebaseUser } = useAuth();
    const [mod, setMod] = useState<Module | null>(null);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [progressMap, setProgressMap] = useState<Record<string, LessonProgress>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                // Module
                const modSnap = await getDoc(doc(db, 'modules', moduleId));
                if (modSnap.exists()) {
                    setMod({ id: modSnap.id, ...modSnap.data() } as Module);
                }

                // Lessons
                const lessonSnap = await getDocs(
                    query(
                        collection(db, 'lessons'),
                        where('moduleId', '==', moduleId),
                        orderBy('order', 'asc')
                    )
                );
                setLessons(
                    lessonSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Lesson))
                );

                // Progress
                if (firebaseUser) {
                    const progSnap = await getDocs(
                        collection(db, 'users', firebaseUser.uid, 'progress')
                    );
                    const pMap: Record<string, LessonProgress> = {};
                    progSnap.docs.forEach((d) => {
                        const data = d.data() as LessonProgress;
                        if (data.lessonId) pMap[data.lessonId] = data;
                    });
                    setProgressMap(pMap);
                }
            } catch (err) {
                console.error('Error:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [moduleId, firebaseUser]);

    function formatDuration(seconds: number) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    if (loading) {
        return (
            <div className={styles.lessonListPage}>
                <div className="skeleton" style={{ height: 20, width: 100, marginBottom: 20 }} />
                <div className="skeleton" style={{ height: 32, width: '60%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 16, width: '40%', marginBottom: 24 }} />
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="skeleton" style={{ height: 60, marginBottom: 8 }} />
                ))}
            </div>
        );
    }

    return (
        <div className={styles.lessonListPage}>
            <Link href="/app/aulas" className={styles.backLink}>
                <ArrowLeft size={16} /> Voltar para módulos
            </Link>

            {mod && (
                <div className={styles.moduleHeader}>
                    <h1 className={styles.moduleHeaderTitle}>{mod.title}</h1>
                    <p className={styles.moduleHeaderDesc}>{mod.description}</p>
                </div>
            )}

            <div className={styles.lessonList}>
                {lessons.map((lesson, i) => {
                    const prog = progressMap[lesson.id];
                    const completed = prog?.completed || false;
                    return (
                        <motion.div
                            key={lesson.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2, delay: i * 0.04 }}
                        >
                            <Link
                                href={`/app/aulas/${moduleId}/${lesson.id}`}
                                className={styles.lessonItem}
                            >
                                <div
                                    className={`${styles.lessonNumber} ${completed ? styles.lessonCompleted : ''}`}
                                >
                                    {completed ? <Check size={14} /> : i + 1}
                                </div>
                                <div className={styles.lessonInfo}>
                                    <div className={styles.lessonTitle}>{lesson.title}</div>
                                    <div className={styles.lessonDuration}>
                                        <Clock size={11} /> {formatDuration(lesson.duration)}
                                    </div>
                                </div>
                                {completed && (
                                    <Check size={16} className={styles.lessonCheck} />
                                )}
                            </Link>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
