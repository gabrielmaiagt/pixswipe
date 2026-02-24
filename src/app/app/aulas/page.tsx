'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import {
    collection,
    getDocs,
    query,
    orderBy,
    where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import type { Module } from '@/types';
import styles from './aulas.module.css';

export default function AulasPage() {
    const { firebaseUser } = useAuth();
    const [modules, setModules] = useState<Module[]>([]);
    const [progressMap, setProgressMap] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchModules() {
            try {
                const snap = await getDocs(
                    query(
                        collection(db, 'modules'),
                        where('status', '==', 'published'),
                        orderBy('order', 'asc')
                    )
                );
                setModules(
                    snap.docs.map((d) => ({ id: d.id, ...d.data() } as Module))
                );

                // Fetch user progress
                if (firebaseUser) {
                    const progSnap = await getDocs(
                        collection(db, 'users', firebaseUser.uid, 'progress')
                    );
                    const pMap: Record<string, number> = {};
                    progSnap.docs.forEach((d) => {
                        const data = d.data();
                        if (data.moduleId && data.percentage !== undefined) {
                            pMap[data.moduleId] = data.percentage;
                        }
                    });
                    setProgressMap(pMap);
                }
            } catch (err) {
                console.error('Error fetching modules:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchModules();
    }, [firebaseUser]);

    return (
        <div className={styles.aulasPage}>
            <h1>Aulas</h1>

            {loading ? (
                <div className={styles.modulesGrid}>
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className={styles.moduleCard}>
                            <div className={styles.moduleCover}>
                                <div className="skeleton" style={{ width: '100%', height: '100%' }} />
                            </div>
                            <div className={styles.moduleBody}>
                                <div className="skeleton" style={{ height: 18, width: '80%', marginBottom: 8 }} />
                                <div className="skeleton" style={{ height: 14, width: '60%' }} />
                            </div>
                        </div>
                    ))}
                </div>
            ) : modules.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-secondary)' }}>
                    <BookOpen size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
                    <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, marginBottom: 8 }}>
                        Módulos em breve
                    </h3>
                    <p style={{ fontSize: 'var(--font-sm)' }}>
                        Novos módulos e aulas serão publicados em breve.
                    </p>
                </div>
            ) : (
                <div className={styles.modulesGrid}>
                    {modules.map((mod, i) => {
                        const progress = progressMap[mod.id] || 0;
                        return (
                            <motion.div
                                key={mod.id}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: i * 0.05 }}
                            >
                                <Link
                                    href={`/app/aulas/${mod.id}`}
                                    className={styles.moduleCard}
                                >
                                    <div className={styles.moduleCover}>
                                        {mod.coverUrl ? (
                                            <img
                                                src={mod.coverUrl}
                                                alt={mod.title}
                                                className={styles.moduleCoverImg}
                                            />
                                        ) : (
                                            <BookOpen size={32} />
                                        )}
                                        <span className={styles.moduleOrder}>{mod.order}</span>
                                    </div>
                                    <div className={styles.moduleBody}>
                                        <h3 className={styles.moduleTitle}>{mod.title}</h3>
                                        <p className={styles.moduleDesc}>{mod.description}</p>
                                        <div className={styles.progressWrap}>
                                            <div
                                                className={styles.progressBar}
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                        <div className={styles.progressLabel}>{progress}%</div>
                                    </div>
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
