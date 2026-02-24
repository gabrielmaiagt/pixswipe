'use client';

import { useState } from 'react';
import { Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { toast } from 'react-hot-toast';

interface FileUploadProps {
    onUploadComplete: (url: string) => void;
    folder?: string;
    label?: string;
    accept?: string;
}

export default function FileUpload({
    onUploadComplete,
    folder = 'assets',
    label = 'Escolher arquivo',
    accept = 'image/*,video/*'
}: FileUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setProgress(0);

        const storageRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed',
            (snapshot) => {
                const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setProgress(p);
            },
            (error) => {
                console.error('Upload error:', error);
                toast.error('Erro ao subir arquivo');
                setUploading(false);
            },
            async () => {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                onUploadComplete(url);
                setUploading(false);
                toast.success('Upload concluído!');
            }
        );
    };

    return (
        <div style={{ position: 'relative' }}>
            <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                background: 'var(--bg-tertiary)',
                borderRadius: '8px',
                border: '1px solid var(--border-secondary)',
                fontSize: '14px',
                cursor: uploading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                color: 'var(--text-primary)',
                opacity: uploading ? 0.7 : 1
            }}>
                {uploading ? (
                    <Loader2 size={16} className="spin" />
                ) : (
                    <Upload size={16} />
                )}
                {uploading ? `Subindo ${Math.round(progress)}%...` : label}
                <input
                    type="file"
                    onChange={handleFileChange}
                    accept={accept}
                    disabled={uploading}
                    style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                />
            </label>
            {uploading && (
                <div style={{
                    position: 'absolute',
                    bottom: '-4px',
                    left: 0,
                    width: '100%',
                    height: '2px',
                    background: 'var(--bg-elevated)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                    marginTop: '4px'
                }}>
                    <div style={{
                        width: `${progress}%`,
                        height: '100%',
                        background: 'var(--brand-primary)',
                        transition: 'width 0.3s ease'
                    }} />
                </div>
            )}
        </div>
    );
}
