'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutGrid,
    Search,
    GraduationCap,
    Bookmark,
    User,
    Bell,
    Headphones,
    Users,
    LogOut,
    Menu,
    X,
    ShieldCheck,
    DollarSign,
    MessageCircle,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from '@/lib/auth';
import { PlanBadge } from '@/components/ui/Badge';
import logoImg from '../../../public/logo.png';
import NotificationBell from '@/components/layout/NotificationBell';
import Paywall from '@/components/auth/Paywall';
import styles from './app-layout.module.css';

const NAV_ITEMS = [
    { label: 'Dashboard', href: '/app', icon: LayoutGrid },
    { label: 'Ofertas', href: '/app/ofertas', icon: Search },
    { label: 'Aulas', href: '/app/aulas', icon: GraduationCap },
    { label: 'Salvos', href: '/app/salvos', icon: Bookmark },
];

const PROFILE_ITEMS = [
    { label: 'Perfil', href: '/app/perfil', icon: User },
    { label: 'Financeiro', href: '/app/financeiro', icon: DollarSign },
    { label: 'Afiliados', href: '/app/afiliados', icon: Users },
    { label: 'Suporte', href: '/app/suporte', icon: Headphones },
    { label: 'Notificações', href: '/app/notificacoes', icon: Bell },
];

export default function AppLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { userData, isAdmin, isActive } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const isPaywalled = userData && !isActive && !isAdmin;

    const initials = userData?.name
        ? userData.name
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
        : '??';

    async function handleLogout() {
        await signOut();
        router.push('/login');
    }

    return (
        <div className={styles.appLayout}>
            {/* Sidebar */}
            <aside
                className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarVisible : ''}`}
            >
                <div className={styles.sidebarLogo}>
                    <Image src={logoImg} alt="Vortex Swipe" height={64} priority />
                </div>

                <nav className={styles.sidebarNav}>
                    <div className={styles.sidebarSection}>Principal</div>
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <span className={styles.navItemIcon}>
                                    <Icon size={18} />
                                </span>
                                {item.label}
                            </Link>
                        );
                    })}

                    <div className={styles.sidebarSection}>Comunidade</div>
                    <a
                        href="https://chat.whatsapp.com/COLE_O_LINK_AQUI"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.navItem}
                        style={{ color: '#25D366' }}
                        onClick={() => setSidebarOpen(false)}
                    >
                        <span className={styles.navItemIcon}>
                            <MessageCircle size={18} />
                        </span>
                        Grupo de Networking
                    </a>

                    <div className={styles.sidebarSection}>Conta</div>
                    {PROFILE_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <span className={styles.navItemIcon}>
                                    <Icon size={18} />
                                </span>
                                {item.label}
                            </Link>
                        );
                    })}

                    {isAdmin && (
                        <>
                            <div className={styles.sidebarSection}>Admin</div>
                            <Link
                                href="/admin"
                                className={`${styles.navItem} ${pathname.startsWith('/admin') ? styles.navItemActive : ''}`}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <span className={styles.navItemIcon}>
                                    <ShieldCheck size={18} />
                                </span>
                                Painel Admin
                            </Link>
                        </>
                    )}
                </nav>

                <div className={styles.sidebarFooter}>
                    <button className={styles.navItem} onClick={handleLogout}>
                        <span className={styles.navItemIcon}>
                            <LogOut size={18} />
                        </span>
                        Sair
                    </button>
                </div>
            </aside>

            {/* Overlay (mobile) */}
            {sidebarOpen && (
                <div
                    className={styles.overlay}
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main content */}
            <div className={styles.mainContent}>
                <header className={styles.topBar}>
                    <div className={styles.topBarLeft}>
                        <button
                            className={styles.menuBtn}
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                        >
                            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                    <div className={styles.topBarRight}>
                        {userData?.plan && (
                            <PlanBadge plan={userData.plan} />
                        )}
                        <NotificationBell />
                        <Link href="/app/perfil">
                            <div className={styles.userAvatar}>{initials}</div>
                        </Link>
                    </div>
                </header>
                <main className={styles.pageContent}>
                    {isPaywalled ? <Paywall status={userData?.entitlementStatus || 'expired'} /> : children}
                </main>
            </div>
        </div>
    );
}
