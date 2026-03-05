'use client';
import { useState, useEffect } from 'react';

interface Asset {
    name: string;
    url: string;
    size: number;
    modified: string;
}

export default function AssetsAdmin() {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);

    const fetchAssets = async () => {
        setLoading(true);
        const res = await fetch('/api/assets');
        if (res.ok) setAssets(await res.json());
        setLoading(false);
    };

    useEffect(() => { fetchAssets(); }, []);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        for (const file of Array.from(files)) {
            const formData = new FormData();
            formData.append('file', file);
            await fetch('/api/upload', { method: 'POST', body: formData });
        }
        setUploading(false);
        fetchAssets();
        e.target.value = '';
    };

    const handleDelete = async (name: string) => {
        if (!confirm(`Delete ${name}?`)) return;
        const res = await fetch('/api/assets', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
        });
        if (res.ok) fetchAssets();
    };

    const copyUrl = (url: string) => {
        navigator.clipboard.writeText(url);
        setCopied(url);
        setTimeout(() => setCopied(null), 2000);
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const isImage = (name: string) => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(name);
    const isAudio = (name: string) => /\.(mp3|wav|ogg|m4a)$/i.test(name);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h1 className="text-gradient" style={{ fontSize: '2rem' }}>Asset Manager</h1>
                <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
                    {uploading ? '⏳ Uploading...' : '📤 Upload Files'}
                    <input type="file" multiple onChange={handleUpload} style={{ display: 'none' }} accept="image/*,audio/*" />
                </label>
            </div>

            {loading ? (
                <div className="animate-pulse" style={{ height: '200px', background: 'var(--glass-border)', borderRadius: '8px' }} />
            ) : assets.length === 0 ? (
                <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center' }}>
                    <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>📁</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>No assets uploaded yet.</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Upload images and audio to use in your stories.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                    {assets.map(asset => (
                        <div key={asset.name} className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column' }}>
                            {/* Preview */}
                            <div style={{
                                height: '140px', borderRadius: 'var(--radius-sm)', marginBottom: '0.75rem',
                                background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                overflow: 'hidden',
                            }}>
                                {isImage(asset.name) ? (
                                    <img src={asset.url} alt={asset.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : isAudio(asset.name) ? (
                                    <div style={{ textAlign: 'center', padding: '1rem' }}>
                                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎵</div>
                                        <audio controls src={asset.url} style={{ width: '100%', maxWidth: '180px' }} />
                                    </div>
                                ) : (
                                    <span style={{ fontSize: '3rem' }}>📄</span>
                                )}
                            </div>

                            {/* Info */}
                            <p style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem', wordBreak: 'break-all', lineHeight: 1.3 }}>
                                {asset.name.replace(/^\d+_/, '')}
                            </p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                                {formatSize(asset.size)}
                            </p>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '0.4rem', marginTop: 'auto' }}>
                                <button onClick={() => copyUrl(asset.url)} className="btn btn-secondary" style={{ flex: 1, padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}>
                                    {copied === asset.url ? '✅ Copied!' : '📋 Copy URL'}
                                </button>
                                <button onClick={() => handleDelete(asset.name)} className="btn btn-danger" style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}>
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
