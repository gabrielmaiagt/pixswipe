'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Beaker,
    Trash2,
    RefreshCw,
    Loader2,
    CheckCircle,
    AlertTriangle,
    Database,
    Package,
    BookOpen,
    GraduationCap,
    Users,
    CreditCard,
    Webhook,
    Headphones,
    DollarSign,
} from 'lucide-react';
import {
    seedTestData,
    deleteTestData,
    checkTestSeedExists,
    type SeedCounts,
} from '@/lib/test-seed';
import toast from 'react-hot-toast';
import styles from './TestMode.module.css';

type ActionState = 'idle' | 'seeding' | 'deleting' | 'checking';

export default function TestModePanel() {
    const [seedExists, setSeedExists] = useState<boolean>(false);
    const [counts, setCounts] = useState<SeedCounts | null>(null);
    const [actionState, setActionState] = useState<ActionState>('idle');
    const [progressLog, setProgressLog] = useState<string[]>([]);
    const [confirmDelete, setConfirmDelete] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [lastAction, setLastAction] = useState<string | null>(null);

    const checkSeed = useCallback(async () => {
        setActionState('checking');
        try {
            const result = await checkTestSeedExists();
            setSeedExists(!!result);
            setCounts(result);
        } catch {
            console.error('Erro ao verificar seed');
        } finally {
            setActionState('idle');
        }
    }, []);

    useEffect(() => {
        checkSeed();
    }, [checkSeed]);

    const handleSeed = async () => {
        setActionState('seeding');
        setProgressLog([]);
        try {
            const result = await seedTestData((msg) =>
                setProgressLog((prev) => [...prev, msg])
            );
            setCounts(result);
            setSeedExists(true);
            setLastAction(`Seed criado em ${new Date().toLocaleString('pt-BR')}`);
            toast.success('Dados de teste criados com sucesso!');
        } catch (err) {
            console.error(err);
            toast.error('Erro ao criar dados de teste');
        } finally {
            setActionState('idle');
        }
    };

    const handleDelete = async () => {
        if (confirmDelete !== 'APAGAR') return;
        setShowDeleteModal(false);
        setConfirmDelete('');
        setActionState('deleting');
        setProgressLog([]);
        try {
            const deleted = await deleteTestData((msg) =>
                setProgressLog((prev) => [...prev, msg])
            );
            setCounts(null);
            setSeedExists(false);
            setLastAction(`${deleted} docs removidos em ${new Date().toLocaleString('pt-BR')}`);
            toast.success(`${deleted} documentos de teste removidos`);
        } catch (err) {
            console.error(err);
            toast.error('Erro ao apagar dados de teste');
        } finally {
            setActionState('idle');
        }
    };

    const isLoading = actionState !== 'idle';

    const countItems: { label: string; key: keyof SeedCounts; icon: React.ReactNode }[] = [
        { label: 'Ofertas', key: 'offers', icon: <Package size={14} /> },
        { label: 'Módulos', key: 'modules', icon: <BookOpen size={14} /> },
        { label: 'Aulas', key: 'lessons', icon: <GraduationCap size={14} /> },
        { label: 'Usuários', key: 'users', icon: <Users size={14} /> },
        { label: 'Pagamentos', key: 'payments', icon: <CreditCard size={14} /> },
        { label: 'Webhooks', key: 'webhookLogs', icon: <Webhook size={14} /> },
        { label: 'Tickets', key: 'supportTickets', icon: <Headphones size={14} /> },
        { label: 'Afiliados', key: 'affiliates', icon: <DollarSign size={14} /> },
    ];

    return (
        <div className={styles.testModePanel}>
            <div className={styles.testModeHeader}>
                <div className={styles.testModeTitle}>
                    <Beaker size={20} />
                    <h2>Modo Teste</h2>
                </div>
                <div className={`${styles.testModeBadge} ${seedExists ? styles.badgeOn : styles.badgeOff}`}>
                    <Database size={12} />
                    {actionState === 'checking' ? 'Verificando...' : seedExists ? 'SEED ATIVO' : 'SEM SEED'}
                </div>
            </div>

            <p className={styles.testModeDesc}>
                Crie dados fictícios para visualizar o sistema completo e detectar bugs de UI/fluxo.
                Todos os dados possuem a flag <code>isTestData: true</code>.
            </p>

            {/* Counts */}
            {counts && seedExists && (
                <div className={styles.countsGrid}>
                    {countItems.map((item) => (
                        <div key={item.key} className={styles.countItem}>
                            {item.icon}
                            <span className={styles.countValue}>{counts[item.key]}</span>
                            <span className={styles.countLabel}>{item.label}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Actions */}
            <div className={styles.testModeActions}>
                <button
                    className={styles.seedBtn}
                    onClick={handleSeed}
                    disabled={isLoading}
                >
                    {actionState === 'seeding' ? (
                        <><Loader2 size={16} className={styles.spin} /> Criando...</>
                    ) : seedExists ? (
                        <><RefreshCw size={16} /> Recriar dados de teste</>
                    ) : (
                        <><CheckCircle size={16} /> Gerar dados de teste</>
                    )}
                </button>

                {seedExists && (
                    <button
                        className={styles.deleteBtn}
                        onClick={() => setShowDeleteModal(true)}
                        disabled={isLoading}
                    >
                        {actionState === 'deleting' ? (
                            <><Loader2 size={16} className={styles.spin} /> Apagando...</>
                        ) : (
                            <><Trash2 size={16} /> Apagar dados de teste</>
                        )}
                    </button>
                )}
            </div>

            {/* Progress Log */}
            {progressLog.length > 0 && (
                <div className={styles.progressLog}>
                    {progressLog.map((msg, i) => (
                        <div key={i} className={styles.progressItem}>
                            {msg.startsWith('✅') ? (
                                <CheckCircle size={12} className={styles.logSuccess} />
                            ) : (
                                <Loader2 size={12} className={styles.logSpinner} />
                            )}
                            {msg}
                        </div>
                    ))}
                </div>
            )}

            {/* Last action */}
            {lastAction && (
                <div className={styles.lastAction}>Última ação: {lastAction}</div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalIcon}>
                            <AlertTriangle size={32} />
                        </div>
                        <h3>Apagar dados de teste</h3>
                        <p>
                            Isso vai remover <strong>todos</strong> os documentos com{' '}
                            <code>isTestData: true</code> do Firestore.
                        </p>
                        <p className={styles.modalWarn}>
                            Digite <strong>APAGAR</strong> para confirmar:
                        </p>
                        <input
                            type="text"
                            value={confirmDelete}
                            onChange={(e) => setConfirmDelete(e.target.value)}
                            placeholder="APAGAR"
                            className={styles.modalInput}
                            autoFocus
                        />
                        <div className={styles.modalActions}>
                            <button
                                className={styles.modalCancel}
                                onClick={() => { setShowDeleteModal(false); setConfirmDelete(''); }}
                            >
                                Cancelar
                            </button>
                            <button
                                className={styles.modalConfirm}
                                onClick={handleDelete}
                                disabled={confirmDelete !== 'APAGAR'}
                            >
                                Confirmar exclusão
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
