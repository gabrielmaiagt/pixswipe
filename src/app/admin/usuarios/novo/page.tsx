'use client';

import UserForm from '@/components/admin/UserForm';
import styles from '../../admin.module.css';

export default function NewUserPage() {
    return (
        <div>
            <div className={styles.adminHeader}>
                <h1>Novo Usuário</h1>
            </div>
            <UserForm />
        </div>
    );
}
