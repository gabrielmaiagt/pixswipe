'use client';

import ModuleForm from '@/components/admin/ModuleForm';
import styles from '../../admin.module.css';

export default function NewModulePage() {
    return (
        <div>
            <div className={styles.adminHeader}>
                <h1>Novo Módulo</h1>
            </div>
            <ModuleForm />
        </div>
    );
}
