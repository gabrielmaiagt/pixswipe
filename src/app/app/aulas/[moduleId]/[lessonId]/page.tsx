'use client';

import { useState, useEffect, useRef, useCallback, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Bookmark, BookmarkCheck } from 'lucide-react';
import {
    doc,
    getDoc,
    setDoc,
    deleteDoc,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import type { Lesson, LessonProgress } from '@/types';
import toast from 'react-hot-toast';
import styles from '@/app/app/aulas/aulas.module.css';

export default function LessonPlayerPage({
    params,
}: {
    params: Promise<{ moduleId: string; lessonId: string }>;
}) {
    const { moduleId, lessonId } = use(params);
    const { firebaseUser } = useAuth();
    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [progress, setProgress] = useState<LessonProgress | null>(null);
    const [isSaved, setIsSaved] = useState(false);
    const [loading, setLoading] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);
    const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        async function fetchLesson() {
            try {
                const snap = await getDoc(doc(db, 'lessons', lessonId));
                if (snap.exists()) {
                    setLesson({ id: snap.id, ...snap.data() } as Lesson);
                }

                if (firebaseUser) {
                    // Progress
                    const progSnap = await getDoc(
                        doc(db, 'users', firebaseUser.uid, 'progress', lessonId)
                    );
                    if (progSnap.exists()) {
                        setProgress(progSnap.data() as LessonProgress);
                    }

                    // Saved
                    const savedSnap = await getDoc(
                        doc(db, 'users', firebaseUser.uid, 'savedLessons', lessonId)
                    );
                    setIsSaved(savedSnap.exists());
                }
            } catch (err) {
                console.error('Error:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchLesson();
    }, [lessonId, firebaseUser]);

    // Auto-save progress every 10 seconds
    const saveProgress = useCallback(async () => {
        if (!firebaseUser || !videoRef.current || !lesson) return;
        const watched = Math.floor(videoRef.current.currentTime);
        const completed = watched / lesson.duration >= 0.9;

        const data: LessonProgress = {
            lessonId,
            watchedSeconds: watched,
            completed,
            lastWatchedAt: serverTimestamp() as any,
        };

        await setDoc(doc(db, 'users', firebaseUser.uid, 'progress', lessonId), data);
        setProgress(data);

        if (completed) {
            toast.success('Aula concluída! 🎉');
        }
    }, [firebaseUser, lessonId, lesson]);

    useEffect(() => {
        saveIntervalRef.current = setInterval(saveProgress, 10000);
        return () => {
            if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
        };
    }, [saveProgress]);

    // Save on unmount
    useEffect(() => {
        return () => {
            saveProgress();
        };
    }, [saveProgress]);

    // Toggle save
    async function toggleSave() {
        if (!firebaseUser) return;
        const ref = doc(db, 'users', firebaseUser.uid, 'savedLessons', lessonId);
        if (isSaved) {
            await deleteDoc(ref);
            setIsSaved(false);
        } else {
            await setDoc(ref, { lessonId, savedAt: serverTimestamp() });
            setIsSaved(true);
            toast.success('Aula salva!');
        }
    }

    function formatDuration(seconds: number) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    if (loading) {
        return (
            <div className={styles.playerPage}>
                <div className="skeleton" style={{ height: 20, width: 100, marginBottom: 20 }} />
                <div className="skeleton" style={{ paddingBottom: '56.25%', marginBottom: 20 }} />
                <div className="skeleton" style={{ height: 28, width: '70%' }} />
            </div>
        );
    }

    if (!lesson) {
        return (
            <div className={styles.playerPage}>
                <Link href={`/app/aulas/${moduleId}`} className={styles.backLink}>
                    <ArrowLeft size={16} /> Voltar
                </Link>
                <p style={{ color: 'var(--text-secondary)' }}>Aula não encontrada.</p>
            </div>
        );
    }

    // Determine if it's an embedded URL (YouTube, Vimeo) or direct video
    const isEmbed =
        lesson.videoUrl.includes('youtube') ||
        lesson.videoUrl.includes('vimeo') ||
        lesson.videoUrl.includes('embed');

    // Plan Restriction Check
    const { userData } = useAuth();
    const hasPlanAccess = userData && (
        userData.role === 'admin' ||
        lesson.availableOnPlans.includes(userData.plan)
    );

    if (!hasPlanAccess) {
        return (
            <div className={styles.playerPage}>
                <Link href={`/app/aulas/${moduleId}`} className={styles.backLink}>
                    <ArrowLeft size={16} /> Voltar
                </Link>
                <div className={styles.restrictedCard}>
                    <div className={styles.lockIcon}><Check size={48} /></div>
                    <h2>Aula Restrita</h2>
                    <p>
                        Esta aula está disponível apenas para membros dos planos {lesson.availableOnPlans.join(', ')}.
                        Seu plano atual é <strong>{userData?.plan}</strong>.
                    </p>
                    <Link href="/#precos">
                        <Button variant="primary">Fazer Upgrade Agora</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.playerPage}>
            <Link href={`/app/aulas/${moduleId}`} className={styles.backLink}>
                <ArrowLeft size={16} /> Voltar para aulas
            </Link>

            {/* Video */}
            <div className={styles.videoWrap}>
                {isEmbed ? (
                    <iframe
                        src={lesson.videoUrl}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                ) : (
                    <video
                        ref={videoRef}
                        src={lesson.videoUrl}
                        controls
                        onLoadedMetadata={() => {
                            if (progress && videoRef.current) {
                                videoRef.current.currentTime = progress.watchedSeconds;
                            }
                        }}
                    />
                )}
            </div>

            {/* Header */}
            <div className={styles.playerHeader}>
                <div>
                    <h1 className={styles.playerTitle}>{lesson.title}</h1>
                    <p className={styles.playerMeta}>
                        {formatDuration(lesson.duration)} • {lesson.description}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <Button
                        variant={isSaved ? 'primary' : 'secondary'}
                        size="sm"
                        icon={isSaved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                        onClick={toggleSave}
                    >
                        {isSaved ? 'Salva' : 'Salvar'}
                    </Button>
                    {progress?.completed && (
                        <Button variant="ghost" size="sm" icon={<Check size={14} />} disabled>
                            Concluída
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
