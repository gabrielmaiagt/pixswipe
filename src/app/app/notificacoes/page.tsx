'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Bell,
    BellOff,
    CheckCheck,
    ExternalLink,
    Package,
    BookOpen,
    Info,
} from 'lucide-react';
import {
    collection,
    getDocs,
    doc,
    updateDoc,
    query,
    orderBy,
    where,
    writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import type { Notification } from '@/types';
import Link from 'next/link';

const typeIcons: Record<string, React.ReactNode> = {
    new_offer: <Package size={16} />,
    new_lesson: <BookOpen size={16} />,
    system: <Info size={16} />,
};

const typeColors: Record<string, string> = {
    new_offer: 'var(--brand-primary)',
    new_lesson: 'var(--accent-blue)',
    system: 'var(--plan-annual)',
};

export default function NotificacoesPage() {
    const { firebaseUser } = useAuth();
    const [notifications, setNotifications] = useState<(Notification & { id: string })[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!firebaseUser) return;
        async function fetchNotifications() {
            try {
                const snap = await getDocs(
                    query(
                        collection(db, 'users', firebaseUser!.uid, 'notifications'),
                        orderBy('createdAt', 'desc')
                    )
                );
                setNotifications(
                    snap.docs.map((d) => ({ id: d.id, ...d.data() } as Notification & { id: string }))
                );
            } catch (err) {
                console.error('Error:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchNotifications();
    }, [firebaseUser]);

    async function markAsRead(notifId: string) {
        if (!firebaseUser) return;
        await updateDoc(
            doc(db, 'users', firebaseUser.uid, 'notifications', notifId),
            { read: true }
        );
        setNotifications((prev) =>
            prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
        );
    }

    async function markAllRead() {
        if (!firebaseUser) return;
        const batch = writeBatch(db);
        notifications
            .filter((n) => !n.read)
            .forEach((n) => {
                batch.update(
                    doc(db, 'users', firebaseUser.uid, 'notifications', n.id),
                    { read: true }
                );
            });
        await batch.commit();
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }

    const unreadCount = notifications.filter((n) => !n.read).length;

    if (loading) {
        return (
            <div>
                <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, marginBottom: 24 }}>
                    Notificações
                </h1>
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="skeleton" style={{ height: 72, marginBottom: 8, borderRadius: 12 }} />
                ))}
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 700 }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 24,
            }}>
                <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 800 }}>
                    Notificações {unreadCount > 0 && <span style={{ color: 'var(--brand-primary)' }}>({unreadCount})</span>}
                </h1>
                {unreadCount > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        icon={<CheckCheck size={14} />}
                        onClick={markAllRead}
                    >
                        Marcar todas como lidas
                    </Button>
                )}
            </div>

            {notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-secondary)' }}>
                    <BellOff size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
                    <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, marginBottom: 8 }}>
                        Nenhuma notificação
                    </h3>
                    <p style={{ fontSize: 'var(--font-sm)' }}>
                        Você será notificado sobre novas ofertas e aulas.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {notifications.map((notif, i) => (
                        <motion.div
                            key={notif.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2, delay: i * 0.03 }}
                            onClick={() => !notif.read && markAsRead(notif.id)}
                            style={{
                                background: notif.read ? 'var(--bg-card)' : 'var(--bg-elevated)',
                                border: `1px solid ${notif.read ? 'var(--border-secondary)' : 'var(--border-hover)'}`,
                                borderRadius: 'var(--radius-md)',
                                padding: '14px 16px',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 12,
                                cursor: notif.read ? 'default' : 'pointer',
                                transition: 'all 0.2s',
                            }}
                        >
                            <div style={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                background: `${typeColors[notif.type] || 'var(--text-muted)'}20`,
                                color: typeColors[notif.type] || 'var(--text-muted)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}>
                                {typeIcons[notif.type] || <Bell size={16} />}
                            </div>

                            <div style={{ flex: 1 }}>
                                <div style={{
                                    fontSize: 'var(--font-base)',
                                    fontWeight: notif.read ? 500 : 600,
                                    marginBottom: 2,
                                }}>
                                    {notif.title}
                                </div>
                                <div style={{
                                    fontSize: 'var(--font-sm)',
                                    color: 'var(--text-tertiary)',
                                }}>
                                    {notif.body}
                                </div>
                                <div style={{
                                    fontSize: 'var(--font-xs)',
                                    color: 'var(--text-muted)',
                                    marginTop: 6,
                                }}>
                                    {notif.createdAt?.toDate?.().toLocaleDateString('pt-BR') || ''}
                                </div>
                            </div>

                            {notif.link && (
                                <Link href={notif.link} style={{ flexShrink: 0, color: 'var(--text-tertiary)' }}>
                                    <ExternalLink size={16} />
                                </Link>
                            )}

                            {!notif.read && (
                                <div style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    background: 'var(--brand-primary)',
                                    flexShrink: 0,
                                    marginTop: 6,
                                }} />
                            )}
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
