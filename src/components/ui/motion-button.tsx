'use client';

import React, { FC } from 'react';
import { ArrowRight } from 'lucide-react';
import styles from './motion-button.module.css';

interface Props {
  label: string;
  onClick?: () => void;
  className?: string;
}

export const MotionButton: FC<Props> = ({ label, onClick, className = '' }) => {
  return (
    <button className={`${styles.button} ${className}`} onClick={onClick}>
      <span className={styles.circle} aria-hidden="true"></span>
      <div className={styles.iconWrapper}>
        <ArrowRight className={styles.icon} />
      </div>
      <span className={styles.text}>{label}</span>
    </button>
  );
};
