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
    History,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import styles from './admin.module.css';

const NAV_SECTIONS = [
    {
        title: 'Negócios',
        items: [
            { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
            { label: 'Vendas', href: '/admin/vendas', icon: ShoppingBag },
            { label: 'Financeiro', href: '/admin/financeiro', icon: DollarSign },
        ]
    },
    {
        title: 'Conteúdo',
        items: [
            { label: 'Ofertas', href: '/admin/ofertas', icon: Package },
            { label: 'Treinamentos', href: '/admin/modulos', icon: GraduationCap },
            { label: 'Assets', href: '/admin/assets', icon: ImageIcon },
        ]
    },
    {
        title: 'Comunidade',
        items: [
            { label: 'Usuários', href: '/admin/usuarios', icon: Users },
            { label: 'Afiliados', href: '/admin/afiliados', icon: DollarSign },
            { label: 'Suporte', href: '/admin/suporte', icon: Headphones },
            { label: 'Notificações', href: '/admin/notificacoes', icon: Bell },
        ]
    },
    {
        title: 'Técnico',
        items: [
            { label: 'Logs de Sync', href: '/admin/logs-sync', icon: History },
            { label: 'Webhooks', href: '/admin/webhooks', icon: Webhook },
            { label: 'Configurações', href: '/admin/configuracoes', icon: Settings },
        ]
    }
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
                    {NAV_SECTIONS.map((section) => (
                        <div key={section.title} className={styles.navSection}>
                            <h4 className={styles.navSectionTitle}>{section.title}</h4>
                            {section.items.map((item) => {
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
                        </div>
                    ))}
                </nav>
            </aside>
            <main className={styles.adminMain}>{children}</main>
        </div>
    );
}
