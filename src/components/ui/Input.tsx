'use client';

import { type InputHTMLAttributes, type TextareaHTMLAttributes, forwardRef } from 'react';
import styles from './Input.module.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, hint, className = '', ...props }, ref) => {
        return (
            <div className={styles.group}>
                {label && <label className={styles.label}>{label}</label>}
                <input
                    ref={ref}
                    className={`${styles.input} ${error ? styles.error : ''} ${className}`}
                    {...props}
                />
                {error && <span className={styles.errorText}>{error}</span>}
                {hint && !error && <span className={styles.hint}>{hint}</span>}
            </div>
        );
    }
);

Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ label, error, className = '', ...props }, ref) => {
        return (
            <div className={styles.group}>
                {label && <label className={styles.label}>{label}</label>}
                <textarea
                    ref={ref}
                    className={`${styles.input} ${styles.textarea} ${error ? styles.error : ''} ${className}`}
                    {...props}
                />
                {error && <span className={styles.errorText}>{error}</span>}
            </div>
        );
    }
);

Textarea.displayName = 'Textarea';

interface SelectProps extends InputHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ label, error, options, className = '', ...props }, ref) => {
        return (
            <div className={styles.group}>
                {label && <label className={styles.label}>{label}</label>}
                <select
                    ref={ref}
                    className={`${styles.input} ${styles.select} ${error ? styles.error : ''} ${className}`}
                    {...(props as any)}
                >
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                {error && <span className={styles.errorText}>{error}</span>}
            </div>
        );
    }
);

Select.displayName = 'Select';
