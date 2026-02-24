'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bell, BellOff } from 'lucide-react';
import {
    collection,
    getDocs,
    doc,
    updateDoc,
    query,
    orderBy,
    limit,
    where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import type { Notification } from '@/types';
import styles from './NotificationBell.module.css';

export default function NotificationBell() {
    const { firebaseUser } = useAuth();
    const [notifications, setNotifications] = useState<(Notification & { id: string })[]>([]);
    const [open, setOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter((n) => !n.read).length;

    useEffect(() => {
        if (!firebaseUser) return;
        async function fetchRecent() {
            const snap = await getDocs(
                query(
                    collection(db, 'users', firebaseUser!.uid, 'notifications'),
                    orderBy('createdAt', 'desc'),
                    limit(10)
                )
            );
            setNotifications(
                snap.docs.map((d) => ({ id: d.id, ...d.data() } as Notification & { id: string }))
            );
        }
        fetchRecent();
    }, [firebaseUser]);

    // Close on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        if (open) document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

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

    return (
        <div className={styles.bellWrap} ref={panelRef}>
            <button className={styles.bellBtn} onClick={() => setOpen(!open)}>
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
            </button>

            {open && (
                <div className={styles.panel}>
                    <div className={styles.panelHeader}>
                        <h4>Notificações</h4>
                        <Link href="/app/notificacoes" className={styles.viewAll} onClick={() => setOpen(false)}>
                            Ver todas
                        </Link>
                    </div>

                    {notifications.length === 0 ? (
                        <div className={styles.emptyPanel}>
                            <BellOff size={24} style={{ opacity: 0.4, marginBottom: 8 }} />
                            <p>Nenhuma notificação</p>
                        </div>
                    ) : (
                        <div className={styles.panelList}>
                            {notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    className={`${styles.panelItem} ${!notif.read ? styles.panelItemUnread : ''}`}
                                    onClick={() => {
                                        if (!notif.read) markAsRead(notif.id);
                                        if (notif.link) {
                                            setOpen(false);
                                        }
                                    }}
                                >
                                    <div className={`${styles.panelDot} ${notif.read ? styles.panelDotRead : ''}`} />
                                    <div className={styles.panelContent}>
                                        <div className={styles.panelTitle}>{notif.title}</div>
                                        <div className={styles.panelBody}>{notif.body}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
