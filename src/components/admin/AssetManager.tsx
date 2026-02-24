'use client';

import { useState, useEffect } from 'react';
import {
    Upload,
    X,
    Link as LinkIcon,
    Trash2,
    Image as ImageIcon,
    FileText,
    Plus,
    Check
} from 'lucide-react';
import {
    ref,
    uploadBytesResumable,
    getDownloadURL,
    listAll,
    deleteObject,
    getMetadata
} from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { toast } from 'react-hot-toast';
import styles from '@/app/admin/admin.module.css';

interface Asset {
    name: string;
    url: string;
    type: string;
    size: number;
    updatedAt: Date;
}

interface AssetManagerProps {
    onSelect?: (url: string) => void;
}

export default function AssetManager({ onSelect }: AssetManagerProps) {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState<Record<string, number>>({});
    const [copied, setCopied] = useState<string | null>(null);

    async function fetchAssets() {
        setLoading(true);
        try {
            const listRef = ref(storage, 'assets');
            const res = await listAll(listRef);

            const assetPromises = res.items.map(async (item) => {
                const url = await getDownloadURL(item);
                const metadata = await getMetadata(item);
                return {
                    name: item.name,
                    url,
                    type: metadata.contentType || 'unknown',
                    size: metadata.size,
                    updatedAt: new Date(metadata.updated || metadata.timeCreated || Date.now())
                };
            });

            const resolvedAssets = await Promise.all(assetPromises);
            setAssets(resolvedAssets.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()));
        } catch (error) {
            console.error('Error fetching assets:', error);
            // Folder might not exist yet
            setAssets([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchAssets();
    }, []);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        Array.from(files).forEach(file => {
            const storageRef = ref(storage, `assets/${Date.now()}_${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploading(prev => ({ ...prev, [file.name]: progress }));
                },
                (error) => {
                    toast.error(`Erro ao subir ${file.name}`);
                    setUploading(prev => {
                        const next = { ...prev };
                        delete next[file.name];
                        return next;
                    });
                },
                async () => {
                    toast.success(`${file.name} enviado!`);
                    setUploading(prev => {
                        const next = { ...prev };
                        delete next[file.name];
                        return next;
                    });
                    fetchAssets();
                }
            );
        });
    };

    const handleDelete = async (assetName: string) => {
        if (!confirm('Tem certeza que deseja excluir este arquivo?')) return;

        try {
            const assetRef = ref(storage, `assets/${assetName}`);
            await deleteObject(assetRef);
            toast.success('Arquivo excluído');
            fetchAssets();
        } catch (error) {
            toast.error('Erro ao excluir arquivo');
        }
    };

    const copyToClipboard = (url: string) => {
        navigator.clipboard.writeText(url);
        setCopied(url);
        toast.success('Link copiado!');
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className={styles.assetContainer}>
            <div className={styles.uploadZone}>
                <label className={styles.uploadLabel}>
                    <div className={styles.uploadIcon}>
                        <Upload size={32} />
                    </div>
                    <span>Clique ou arraste para subir arquivos</span>
                    <p>Suporta imagens (PNG, JPG, WebP) e Vídeos</p>
                    <input type="file" multiple onChange={handleUpload} style={{ display: 'none' }} />
                </label>
            </div>

            {Object.keys(uploading).length > 0 && (
                <div className={styles.uploadingBox}>
                    {Object.entries(uploading).map(([name, progress]) => (
                        <div key={name} className={styles.progressItem}>
                            <div className={styles.progressLabel}>
                                <span>{name}</span>
                                <span>{Math.round(progress)}%</span>
                            </div>
                            <div className={styles.progressBar}>
                                <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className={styles.assetGrid} style={{ marginTop: 32 }}>
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="skeleton" style={{ height: 200, borderRadius: 12 }} />
                    ))
                ) : assets.length === 0 ? (
                    <div className={styles.emptyAdmin} style={{ gridColumn: '1 / -1' }}>
                        <ImageIcon size={48} />
                        <p>Nenhum asset na galeria</p>
                    </div>
                ) : (
                    assets.map((asset) => (
                        <div key={asset.name} className={styles.assetCard}>
                            <div className={styles.assetPreview}>
                                {asset.type.startsWith('image') ? (
                                    <img src={asset.url} alt={asset.name} />
                                ) : (
                                    <div className={styles.fileIcon}>
                                        <FileText size={40} />
                                    </div>
                                )}
                                <div className={styles.assetOverlay}>
                                    <button onClick={() => copyToClipboard(asset.url)}>
                                        {copied === asset.url ? <Check size={16} /> : <LinkIcon size={16} />}
                                    </button>
                                    {onSelect && (
                                        <button onClick={() => onSelect(asset.url)} style={{ color: 'var(--brand-primary)' }}>
                                            <Plus size={16} />
                                        </button>
                                    )}
                                    <button onClick={() => handleDelete(asset.name)} style={{ color: 'var(--accent-red)' }}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className={styles.assetInfo}>
                                <span className={styles.assetName}>{asset.name.split('_').slice(1).join('_')}</span>
                                <span className={styles.assetSize}>{(asset.size / 1024 / 1024).toFixed(2)} MB</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
