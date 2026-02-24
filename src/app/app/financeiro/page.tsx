'use client';

import FinancialDashboard from '@/components/finance/FinancialDashboard';
import { DollarSign } from 'lucide-react';

export default function AppFinancePage() {
    return (
        <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '24px' }}>
                <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: 'var(--brand-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff'
                }}>
                    <DollarSign size={24} />
                </div>
                <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Meu Painel Financeiro</h1>
            </div>

            <FinancialDashboard isAdminView={false} />
        </div>
    );
}
