'use client';

import { useState, useEffect } from 'react';
import { Users, Mail, Shield, Search, Plus, Edit, Trash2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PlanBadge, StatusBadge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import type { User } from '@/types';
import styles from '../admin.module.css';

export default function AdminUsuarios() {
    const [users, setUsers] = useState<User[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    // Delete state
    const [confirmUser, setConfirmUser] = useState<User | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    useEffect(() => {
        loadUsers();
    }, []);

    async function loadUsers() {
        const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')));
        setUsers(snap.docs.map((d) => ({ uid: d.id, ...d.data() } as User)));
        setLoading(false);
    }

    const filtered = users.filter(
        (u) =>
            u.name?.toLowerCase().includes(search.toLowerCase()) ||
            u.email?.toLowerCase().includes(search.toLowerCase())
    );

    async function handleDelete() {
        if (!confirmUser) return;
        setDeleting(true);
        setDeleteError('');

        try {
            const res = await fetch('/api/admin/delete-user', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid: confirmUser.uid }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erro ao excluir.');

            setUsers((prev) => prev.filter((u) => u.uid !== confirmUser.uid));
            setConfirmUser(null);
        } catch (err: any) {
            setDeleteError(err.message);
        } finally {
            setDeleting(false);
        }
    }

    return (
        <div>
            <div className={styles.adminHeader}>
                <h1>Usuários ({users.length})</h1>
                <Link href="/admin/usuarios/novo">
                    <Button icon={<Plus size={16} />}>Novo usuário</Button>
                </Link>
            </div>

            <div style={{ marginBottom: 20, position: 'relative', maxWidth: 400 }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                    placeholder="Buscar por nome ou e-mail..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '10px 10px 10px 36px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-secondary)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-primary)',
                        fontSize: 'var(--font-sm)',
                    }}
                />
            </div>

            {loading ? (
                <div className={styles.kpiGrid}>
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="skeleton" style={{ height: 60, borderRadius: 8 }} />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className={styles.emptyAdmin}>
                    <Users size={48} />
                    <p>Nenhum usuário encontrado</p>
                </div>
            ) : (
                <table className={styles.dataTable}>
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>E-mail</th>
                            <th>Plano</th>
                            <th>Status</th>
                            <th>Role</th>
                            <th>Criado em</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((user) => (
                            <tr key={user.uid}>
                                <td style={{ fontWeight: 600 }}>{user.name || '-'}</td>
                                <td>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Mail size={12} style={{ color: 'var(--text-muted)' }} />
                                        {user.email}
                                    </span>
                                </td>
                                <td><PlanBadge plan={user.plan} /></td>
                                <td><StatusBadge status={user.entitlementStatus} /></td>
                                <td>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        {user.role === 'admin' && <Shield size={12} style={{ color: 'var(--brand-primary)' }} />}
                                        {user.role}
                                    </span>
                                </td>
                                <td>{user.createdAt?.toDate ? formatDate(user.createdAt.toDate()) : '-'}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <Link href={`/admin/usuarios/${user.uid}`}>
                                            <button className={styles.editBtn}><Edit size={12} /> Editar</button>
                                        </Link>
                                        <button
                                            className={styles.editBtn}
                                            onClick={() => setConfirmUser(user)}
                                            style={{ color: 'var(--status-error)', borderColor: 'rgba(255,107,107,0.2)' }}
                                        >
                                            <Trash2 size={12} /> Excluir
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* ── Confirmation Modal ── */}
            {confirmUser && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'var(--bg-overlay)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 500, backdropFilter: 'blur(6px)', padding: 16,
                }}>
                    <div style={{
                        background: 'var(--bg-elevated)', border: '1px solid var(--border-primary)',
                        borderRadius: 'var(--radius-xl)', padding: '32px', maxWidth: 440, width: '100%',
                        boxShadow: 'var(--shadow-lg)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                            <div style={{
                                width: 40, height: 40, borderRadius: 'var(--radius-md)',
                                background: 'rgba(255,107,107,0.15)', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}>
                                <AlertTriangle size={20} color="var(--status-error)" />
                            </div>
                            <div>
                                <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700 }}>Excluir usuário?</h3>
                                <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', marginTop: 2 }}>
                                    Esta ação não pode ser desfeita.
                                </p>
                            </div>
                        </div>

                        <div style={{
                            background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
                            padding: '12px 16px', marginBottom: 20,
                        }}>
                            <p style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>{confirmUser.name || '–'}</p>
                            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-xs)', marginTop: 2 }}>{confirmUser.email}</p>
                        </div>

                        {deleteError && (
                            <p style={{ color: 'var(--status-error)', fontSize: 'var(--font-sm)', marginBottom: 12 }}>
                                {deleteError}
                            </p>
                        )}

                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => { setConfirmUser(null); setDeleteError(''); }}
                                disabled={deleting}
                                className="btn btn-secondary btn-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="btn btn-danger btn-sm"
                            >
                                {deleting ? 'Excluindo...' : 'Sim, excluir'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
