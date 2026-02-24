'use client';

import FinancialDashboard from '@/components/finance/FinancialDashboard';
import { DollarSign } from 'lucide-react';
import styles from '@/app/admin/admin.module.css';

export default function AdminFinancePage() {
    return (
        <div>
            <div className={styles.adminHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className={styles.kpiIcon} style={{ background: 'var(--accent-orange)', margin: 0 }}>
                        <DollarSign size={20} />
                    </div>
                    <h1>Painel Financeiro Global</h1>
                </div>
            </div>

            <FinancialDashboard isAdminView={true} />
        </div>
    );
}
