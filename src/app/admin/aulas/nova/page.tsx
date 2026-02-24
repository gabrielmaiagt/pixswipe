'use client';

import LessonForm from '@/components/admin/LessonForm';
import styles from '../../admin.module.css';

export default function NewLessonPage() {
    return (
        <div>
            <div className={styles.adminHeader}>
                <h1>Nova Aula</h1>
            </div>
            <LessonForm />
        </div>
    );
}
