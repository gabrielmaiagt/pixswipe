'use client';

import { type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    Package,
    BookOpen,
    GraduationCap,
    Users,
    DollarSign,
    Bell,
    Headphones,
    Webhook,
    ImageIcon,
    ArrowLeft,
    Settings,
    ShoppingBag,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import styles from './admin.module.css';

const ADMIN_NAV = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Vendas', href: '/admin/vendas', icon: ShoppingBag },
    { label: 'Ofertas', href: '/admin/ofertas', icon: Package },
    { label: 'Módulos', href: '/admin/modulos', icon: BookOpen },
    { label: 'Aulas', href: '/admin/aulas', icon: GraduationCap },
    { label: 'Usuários', href: '/admin/usuarios', icon: Users },
    { label: 'Afiliados', href: '/admin/afiliados', icon: DollarSign },
    { label: 'Notificações', href: '/admin/notificacoes', icon: Bell },
    { label: 'Financeiro', href: '/admin/financeiro', icon: DollarSign },
    { label: 'Suporte', href: '/admin/suporte', icon: Headphones },
    { label: 'Webhooks', href: '/admin/webhooks', icon: Webhook },
    { label: 'Assets', href: '/admin/assets', icon: ImageIcon },
    { label: 'Configurações', href: '/admin/configuracoes', icon: Settings },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { userData, loading } = useAuth();

    if (loading) return null;

    if (userData?.role !== 'admin') {
        return (
            <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}>
                <h2>Acesso negado</h2>
                <p>Você não tem permissão para acessar o painel administrativo.</p>
                <Link href="/app" style={{ color: 'var(--brand-primary)', marginTop: 16, display: 'inline-block' }}>
                    <ArrowLeft size={14} /> Voltar para o app
                </Link>
            </div>
        );
    }

    return (
        <div className={styles.adminLayout}>
            <aside className={styles.adminSidebar}>
                <div className={styles.adminLogo}>
                    <Link href="/admin">⚡ Admin</Link>
                </div>
                <div className={styles.adminExit}>
                    <Link href="/app" className={styles.adminNavItem}>
                        <ArrowLeft size={16} /> Voltar ao App
                    </Link>
                </div>
                <nav className={styles.adminNav}>
                    {ADMIN_NAV.map((item) => {
                        const Icon = item.icon;
                        const isActive =
                            item.href === '/admin'
                                ? pathname === '/admin'
                                : pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`${styles.adminNavItem} ${isActive ? styles.adminNavItemActive : ''}`}
                            >
                                <Icon size={16} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </aside>
            <main className={styles.adminMain}>{children}</main>
        </div>
    );
}
