'use client';

import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    icon?: ReactNode;
    loading?: boolean;
    fullWidth?: boolean;
}

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    icon,
    loading,
    fullWidth,
    disabled,
    className = '',
    ...props
}: ButtonProps) {
    return (
        <motion.button
            whileHover={disabled || loading ? {} : { scale: 1.02 }}
            whileTap={disabled || loading ? {} : { scale: 0.98 }}
            className={`${styles.btn} ${styles[variant]} ${styles[size]} ${fullWidth ? styles.full : ''} ${className}`}
            disabled={disabled || loading}
            {...(props as any)}
        >
            {loading ? (
                <span className={styles.spinner} />
            ) : icon ? (
                <span className={styles.icon}>{icon}</span>
            ) : null}
            {children}
        </motion.button>
    );
}
