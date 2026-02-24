// ===========================
// Utility Functions
// ===========================

import { Timestamp } from 'firebase/firestore';

/**
 * Generate a unique affiliate code (8 chars uppercase alphanumeric)
 */
export function generateAffiliateCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

/**
 * Format currency in BRL
 */
export function formatBRL(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
}

/**
 * Format date in pt-BR
 */
export function formatDate(date: Date | Timestamp): string {
    const d = date instanceof Timestamp ? date.toDate() : date;
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(d);
}

/**
 * Format date with time
 */
export function formatDateTime(date: Date | Timestamp): string {
    const d = date instanceof Timestamp ? date.toDate() : date;
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(d);
}

/**
 * Format seconds into mm:ss or hh:mm:ss
 */
export function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Truncate string with ellipsis
 */
export function truncate(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength - 3) + '...';
}

/**
 * Get initials from name (for avatar fallback)
 */
export function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

/**
 * Copy text to clipboard with fallback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            return true;
        } catch {
            return false;
        } finally {
            document.body.removeChild(textarea);
        }
    }
}

/**
 * Slugify a string for URLs
 */
export function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

/**
 * Plan display names
 */
export const PLAN_LABELS: Record<string, string> = {
    starter: 'Starter',
    pro: 'Pro',
    annual: 'Anual',
};

/**
 * Plan badge colors (CSS classes)
 */
export const PLAN_COLORS: Record<string, string> = {
    starter: 'badge-starter',
    pro: 'badge-pro',
    annual: 'badge-annual',
};

/**
 * Niche options
 */
export const NICHE_OPTIONS = [
    'Emagrecimento',
    'Renda Extra',
    'Relacionamento',
    'Saúde',
    'Finanças',
    'Educação',
    'Tecnologia',
    'Outro',
] as const;

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => void>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}

/**
 * Check if a plan has access to content
 */
export function hasPlanAccess(
    userPlan: string,
    requiredPlans: string[]
): boolean {
    return requiredPlans.includes(userPlan);
}

/**
 * Generate a random ID
 */
export function generateId(): string {
    return crypto.randomUUID?.() ||
        Math.random().toString(36).slice(2) + Date.now().toString(36);
}
