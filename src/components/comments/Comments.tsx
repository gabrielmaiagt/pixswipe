'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Heart, Trash2, MessageSquare, Send } from 'lucide-react';
import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    updateDoc,
    increment,
    orderBy,
    query,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { getInitials } from '@/lib/utils';
import Button from '@/components/ui/Button';
import type { Comment } from '@/types';
import toast from 'react-hot-toast';
import styles from './Comments.module.css';

interface CommentsProps {
    parentCollection: string; // e.g. 'offers' or 'lessons'
    parentId: string;
}

export default function Comments({ parentCollection, parentId }: CommentsProps) {
    const { firebaseUser, userData } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

    const commentsRef = collection(db, parentCollection, parentId, 'comments');

    useEffect(() => {
        async function fetchComments() {
            try {
                const snap = await getDocs(
                    query(commentsRef, orderBy('createdAt', 'desc'))
                );
                setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Comment)));
            } catch (err) {
                console.error('Error fetching comments:', err);
            }
        }
        fetchComments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [parentCollection, parentId]);

    const handleSubmit = useCallback(async () => {
        if (!firebaseUser || !userData || !newComment.trim()) return;
        setSubmitting(true);
        try {
            const docRef = await addDoc(commentsRef, {
                userId: firebaseUser.uid,
                userName: userData.name || 'Anônimo',
                userAvatar: userData.avatarUrl || null,
                text: newComment.trim(),
                createdAt: serverTimestamp(),
                likes: 0,
            });
            setComments((prev) => [
                {
                    id: docRef.id,
                    userId: firebaseUser.uid,
                    userName: userData.name || 'Anônimo',
                    userAvatar: userData.avatarUrl,
                    text: newComment.trim(),
                    createdAt: { toDate: () => new Date() } as any,
                    likes: 0,
                },
                ...prev,
            ]);
            setNewComment('');
            toast.success('Comentário adicionado!');
        } catch {
            toast.error('Erro ao comentar');
        } finally {
            setSubmitting(false);
        }
    }, [firebaseUser, userData, newComment, commentsRef]);

    async function handleLike(commentId: string) {
        if (likedIds.has(commentId)) return;
        setLikedIds((prev) => new Set(prev).add(commentId));
        setComments((prev) =>
            prev.map((c) => (c.id === commentId ? { ...c, likes: c.likes + 1 } : c))
        );
        await updateDoc(doc(db, parentCollection, parentId, 'comments', commentId), {
            likes: increment(1),
        });
    }

    async function handleDelete(commentId: string) {
        if (!confirm('Deletar este comentário?')) return;
        await deleteDoc(doc(db, parentCollection, parentId, 'comments', commentId));
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        toast.success('Comentário removido');
    }

    return (
        <div className={styles.commentsSection}>
            <h3>
                <MessageSquare size={18} /> Comentários ({comments.length})
            </h3>

            {/* Comment form */}
            {firebaseUser && (
                <div className={styles.commentForm}>
                    <textarea
                        className={styles.commentInput}
                        placeholder="Escreva um comentário..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        rows={1}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit();
                            }
                        }}
                    />
                    <Button
                        size="sm"
                        icon={<Send size={14} />}
                        loading={submitting}
                        disabled={!newComment.trim()}
                        onClick={handleSubmit}
                    >
                        Enviar
                    </Button>
                </div>
            )}

            {/* Comments list */}
            {comments.length === 0 ? (
                <div className={styles.emptyComments}>
                    Nenhum comentário ainda. Seja o primeiro!
                </div>
            ) : (
                <div className={styles.commentList}>
                    {comments.map((comment, i) => (
                        <motion.div
                            key={comment.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: i * 0.03 }}
                            className={styles.commentItem}
                        >
                            <div className={styles.commentAvatar}>
                                {getInitials(comment.userName)}
                            </div>
                            <div className={styles.commentBody}>
                                <div className={styles.commentHeader}>
                                    <span className={styles.commentAuthor}>{comment.userName}</span>
                                    <span className={styles.commentDate}>
                                        {comment.createdAt?.toDate?.().toLocaleDateString('pt-BR') || 'agora'}
                                    </span>
                                </div>
                                <p className={styles.commentText}>{comment.text}</p>
                                <div className={styles.commentActions}>
                                    <button
                                        className={`${styles.likeBtn} ${likedIds.has(comment.id) ? styles.likeBtnActive : ''}`}
                                        onClick={() => handleLike(comment.id)}
                                    >
                                        <Heart size={12} /> {comment.likes}
                                    </button>
                                    {firebaseUser?.uid === comment.userId && (
                                        <button
                                            className={styles.deleteBtn}
                                            onClick={() => handleDelete(comment.id)}
                                        >
                                            <Trash2 size={12} /> Deletar
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
