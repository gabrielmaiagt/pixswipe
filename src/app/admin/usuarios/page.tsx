'use client';

import { useState, useEffect } from 'react';
import { Users, Mail, Shield, Search, Plus, Edit } from 'lucide-react';
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

    useEffect(() => {
        async function fetch() {
            const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')));
            setUsers(snap.docs.map((d) => ({ uid: d.id, ...d.data() } as User)));
            setLoading(false);
        }
        fetch();
    }, []);

    const filtered = users.filter(
        (u) =>
            u.name?.toLowerCase().includes(search.toLowerCase()) ||
            u.email?.toLowerCase().includes(search.toLowerCase())
    );

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
                                    <Link href={`/admin/usuarios/${user.uid}`}>
                                        <button className={styles.editBtn}><Edit size={12} /> Editar</button>
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
