'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Input } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Save, Loader2, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './OfferForm.module.css';

export default function SettingsForm() {
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [form, setForm] = useState({
        caktoRecruitmentUrl: '',
        checkoutUrlStarter: '',
        checkoutUrlPro: '',
        supportWhatsapp: '',
    });

    useEffect(() => {
        async function fetchSettings() {
            try {
                const snap = await getDoc(doc(db, 'settings', 'general'));
                if (snap.exists()) {
                    setForm((prev) => ({ ...prev, ...snap.data() }));
                }
            } catch (err) {
                console.error('Error fetching settings:', err);
            } finally {
                setFetching(false);
            }
        }
        fetchSettings();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await setDoc(doc(db, 'settings', 'general'), {
                ...form,
                updatedAt: serverTimestamp(),
            });
            toast.success('Configurações salvas!');
        } catch (err) {
            console.error('Save settings error:', err);
            toast.error('Erro ao salvar as configurações');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <div className="skeleton" style={{ height: 200 }} />;

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Integração Cakto</h3>
                <Input
                    label="Link de Recrutamento de Afiliados"
                    name="caktoRecruitmentUrl"
                    value={form.caktoRecruitmentUrl}
                    onChange={handleChange}
                    placeholder="https://cakto.com.br/afiliacao/seu-produto"
                    hint="Este link será exibido para usuários que ainda não são afiliados."
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                    <Input
                        label="Checkout Plano Starter"
                        name="checkoutUrlStarter"
                        value={form.checkoutUrlStarter}
                        onChange={handleChange}
                        placeholder="https://cakto.com.br/c/..."
                    />
                    <Input
                        label="Checkout Plano Pro"
                        name="checkoutUrlPro"
                        value={form.checkoutUrlPro}
                        onChange={handleChange}
                        placeholder="https://cakto.com.br/c/..."
                    />
                </div>
            </div>

            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Suporte e Contato</h3>
                <Input
                    label="WhatsApp de Suporte (Número com DDD)"
                    name="supportWhatsapp"
                    value={form.supportWhatsapp || ''}
                    onChange={handleChange}
                    placeholder="5511999999999"
                    hint="Número no formato internacional sem símbolos. Ex: 5511999999999"
                />
            </div>

            <div className={styles.actions}>
                <Button type="submit" disabled={loading}>
                    {loading ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
                    Salvar Configurações
                </Button>
            </div>
        </form>
    );
}
