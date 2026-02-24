'use client';

import { useState, useEffect } from 'react';
import { Plus, Send, Bell } from 'lucide-react';
import { collection, getDocs, addDoc, serverTimestamp, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import styles from '../admin.module.css';

export default function AdminNotificacoes() {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [sending, setSending] = useState(false);

    async function handleBroadcast() {
        if (!title.trim() || !body.trim()) {
            toast.error('Preencha título e mensagem');
            return;
        }
        setSending(true);
        try {
            // Get all user IDs
            const usersSnap = await getDocs(collection(db, 'users'));
            const batch: Promise<any>[] = [];
            usersSnap.docs.forEach((userDoc) => {
                batch.push(
                    addDoc(collection(db, 'users', userDoc.id, 'notifications'), {
                        type: 'system',
                        title: title.trim(),
                        body: body.trim(),
                        read: false,
                        createdAt: serverTimestamp(),
                    })
                );
            });
            await Promise.all(batch);
            toast.success(`Enviado para ${usersSnap.size} usuários!`);
            setTitle('');
            setBody('');
        } catch (err) {
            toast.error('Erro ao enviar');
            console.error(err);
        } finally {
            setSending(false);
        }
    }

    return (
        <div>
            <div className={styles.adminHeader}><h1>Notificações</h1></div>

            <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-secondary)',
                borderRadius: 'var(--radius-lg)',
                padding: 24,
                maxWidth: 500,
            }}>
                <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Send size={16} /> Enviar para todos
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <Input
                        label="Título"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ex: Nova oferta disponível!"
                    />
                    <div>
                        <label style={{ fontSize: 'var(--font-sm)', fontWeight: 500, marginBottom: 6, display: 'block' }}>
                            Mensagem
                        </label>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="Corpo da notificação..."
                            rows={3}
                            style={{
                                width: '100%',
                                background: 'var(--bg-input)',
                                border: '1px solid var(--border-primary)',
                                borderRadius: 'var(--radius-md)',
                                padding: '10px 14px',
                                color: 'var(--text-primary)',
                                fontSize: 'var(--font-sm)',
                                resize: 'vertical',
                            }}
                        />
                    </div>
                    <Button
                        icon={<Bell size={16} />}
                        loading={sending}
                        onClick={handleBroadcast}
                    >
                        Enviar notificação
                    </Button>
                </div>
            </div>
        </div>
    );
}
