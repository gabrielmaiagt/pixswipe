'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell,
    BellOff,
    CheckCheck,
    ExternalLink,
    Package,
    BookOpen,
    Info,
    Calendar,
    ChevronRight,
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
    Timestamp,
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

    const groupedNotifications = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const groups: Record<string, (Notification & { id: string })[]> = {
            Hoje: [],
            Ontem: [],
            Anteriores: [],
        };

        notifications.forEach((n) => {
            const date = n.createdAt instanceof Timestamp ? n.createdAt.toDate() : new Date(n.createdAt);
            date.setHours(0, 0, 0, 0);

            if (date.getTime() === today.getTime()) {
                groups['Hoje'].push(n);
            } else if (date.getTime() === yesterday.getTime()) {
                groups['Ontem'].push(n);
            } else {
                groups['Anteriores'].push(n);
            }
        });

        return Object.entries(groups).filter(([_, items]) => items.length > 0);
    }, [notifications]);

    if (loading) {
        return (
            <div style={{ maxWidth: 800 }}>
                <div style={{ height: 40, width: 200, marginBottom: 32 }} className="skeleton" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} style={{ height: 80, borderRadius: 16 }} className="skeleton" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 800 }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 32,
            }}>
                <div>
                    <h1 style={{ fontSize: 'var(--font-3xl)', fontWeight: 800, marginBottom: 4 }}>
                        Notificações
                    </h1>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-sm)' }}>
                        Fique por dentro das novidades da sua conta
                    </p>
                </div>
                {unreadCount > 0 && (
                    <Button
                        variant="secondary"
                        size="sm"
                        icon={<CheckCheck size={16} />}
                        onClick={markAllRead}
                    >
                        Marcar todas como lidas
                    </Button>
                )}
            </div>

            {notifications.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        textAlign: 'center',
                        padding: '100px 24px',
                        background: 'var(--bg-card)',
                        border: '2px dashed var(--border-secondary)',
                        borderRadius: 32,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                    }}
                >
                    <div style={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        background: 'var(--bg-elevated)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 24,
                        color: 'var(--text-muted)'
                    }}>
                        <BellOff size={40} />
                    </div>
                    <h3 style={{ fontSize: 'var(--font-xl)', fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>
                        Silêncio por aqui...
                    </h3>
                    <p style={{ fontSize: 'var(--font-base)', color: 'var(--text-secondary)', maxWidth: 300, margin: '0 auto' }}>
                        Tudo certo! Quando surgirem novas ofertas ou aulas, avisaremos você aqui.
                    </p>
                </motion.div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                    {groupedNotifications.map(([label, items]) => (
                        <div key={label}>
                            <h3 style={{
                                fontSize: 'var(--font-xs)',
                                fontWeight: 700,
                                color: 'var(--text-muted)',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                marginBottom: 12,
                                marginLeft: 16,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8
                            }}>
                                <Calendar size={12} />
                                {label}
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <AnimatePresence mode="popLayout">
                                    {items.map((notif, i) => (
                                        <motion.div
                                            key={notif.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ duration: 0.2, delay: i * 0.05 }}
                                            onClick={() => !notif.read && markAsRead(notif.id)}
                                            style={{
                                                background: notif.read ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.06)',
                                                backdropFilter: 'blur(10px)',
                                                border: `1px solid ${notif.read ? 'rgba(255, 255, 255, 0.1)' : 'var(--brand-primary)'}`,
                                                borderRadius: 24,
                                                padding: '20px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 16,
                                                cursor: 'pointer',
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                position: 'relative',
                                                overflow: 'hidden'
                                            }}
                                            whileHover={{
                                                scale: 1.01,
                                                background: 'rgba(255, 255, 255, 0.08)',
                                                borderColor: 'var(--brand-primary)'
                                            }}
                                        >
                                            {!notif.read && (
                                                <div style={{
                                                    position: 'absolute',
                                                    left: 0,
                                                    top: 0,
                                                    bottom: 0,
                                                    width: 4,
                                                    background: 'var(--brand-primary)'
                                                }} />
                                            )}

                                            <div style={{
                                                width: 48,
                                                height: 48,
                                                borderRadius: 16,
                                                background: `${typeColors[notif.type] || 'var(--text-muted)'}20`,
                                                color: typeColors[notif.type] || 'var(--text-muted)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                            }}>
                                                {typeIcons[notif.type] || <Bell size={20} />}
                                            </div>

                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{
                                                    fontSize: 'var(--font-base)',
                                                    fontWeight: 700,
                                                    color: notif.read ? 'var(--text-secondary)' : 'var(--text-primary)',
                                                    marginBottom: 2,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 8
                                                }}>
                                                    {notif.title}
                                                    {!notif.read && (
                                                        <span style={{
                                                            padding: '2px 8px',
                                                            background: 'var(--brand-primary)',
                                                            color: '#000',
                                                            fontSize: '10px',
                                                            borderRadius: 10,
                                                            fontWeight: 900
                                                        }}>NOVA</span>
                                                    )}
                                                </div>
                                                <div style={{
                                                    fontSize: 'var(--font-sm)',
                                                    color: 'var(--text-tertiary)',
                                                    lineHeight: 1.5,
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}>
                                                    {notif.body}
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                {notif.link ? (
                                                    <Link
                                                        href={notif.link}
                                                        onClick={(e) => e.stopPropagation()}
                                                        style={{
                                                            width: 32,
                                                            height: 32,
                                                            borderRadius: '50%',
                                                            background: 'var(--bg-elevated)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: 'var(--text-tertiary)',
                                                            transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        <ExternalLink size={16} />
                                                    </Link>
                                                ) : (
                                                    <div style={{ color: 'var(--text-muted)', opacity: 0.3 }}>
                                                        <ChevronRight size={18} />
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style jsx global>{`
                .skeleton {
                    background: var(--bg-card);
                    background: linear-gradient(
                        90deg,
                        var(--bg-card) 25%,
                        var(--bg-elevated) 50%,
                        var(--bg-card) 75%
                    );
                    background-size: 200% 100%;
                    animation: skeleton-loading 1.5s infinite;
                }
                @keyframes skeleton-loading {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>
        </div>
    );
}
