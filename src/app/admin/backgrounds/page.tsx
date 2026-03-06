'use client';

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import ImageAssetField from '@/components/admin/ImageAssetField';
import { useAssetLibrary } from '@/components/admin/use-asset-library';
import { deriveAssetLabel } from '@/lib/asset-utils';

interface BackgroundRecord {
    id: string;
    name: string;
    imageUrl: string;
}

export default function BackgroundsAdminPage() {
    const [backgrounds, setBackgrounds] = useState<BackgroundRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const imageAssets = useAssetLibrary('image');

    const fetchBackgrounds = useCallback(async () => {
        setLoading(true);
        const response = await fetch('/api/backgrounds');
        if (response.ok) {
            setBackgrounds(await response.json());
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchBackgrounds();
        }, 0);
        return () => clearTimeout(timer);
    }, [fetchBackgrounds]);

    function resetForm() {
        setEditingId(null);
        setName('');
        setImageUrl('');
    }

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        const trimmedName = name.trim();
        const trimmedUrl = imageUrl.trim();
        if (!trimmedName || !trimmedUrl) {
            return;
        }

        const response = await fetch(editingId ? `/api/backgrounds/${editingId}` : '/api/backgrounds', {
            method: editingId ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: trimmedName,
                imageUrl: trimmedUrl,
            }),
        });

        if (response.ok) {
            resetForm();
            fetchBackgrounds();
        }
    }

    function handleEdit(background: BackgroundRecord) {
        setEditingId(background.id);
        setName(background.name);
        setImageUrl(background.imageUrl);
        window.scrollTo(0, 0);
    }

    async function handleDelete(id: string) {
        if (!confirm('Delete this background? Nodes using it will keep no background assigned.')) {
            return;
        }

        const response = await fetch(`/api/backgrounds/${id}`, { method: 'DELETE' });
        if (response.ok) {
            if (editingId === id) {
                resetForm();
            }
            fetchBackgrounds();
        }
    }

    function handleImageChange(value: string) {
        setImageUrl(value);
        setName((current) => current.trim() ? current : deriveAssetLabel(value, 'Background'));
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                    <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '0.35rem' }}>Backgrounds</h1>
                    <p style={{ color: 'var(--text-muted)' }}>
                        Reusable scene backdrops for every story. Upload once, name them clearly, then assign them in node editors.
                    </p>
                </div>
                <Link href="/admin/assets" className="btn btn-secondary">
                    Open Asset Library
                </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(360px, 1fr) 1.7fr', gap: '2rem' }}>
                <div className="glass-panel" style={{ padding: '2rem', height: 'fit-content' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>{editingId ? 'Edit Background' : 'Create Background'}</h3>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                placeholder="City Council Night"
                                required
                            />
                        </div>

                        <ImageAssetField
                            label="Background Image"
                            value={imageUrl}
                            onChange={handleImageChange}
                            assets={imageAssets.assets}
                            uploading={imageAssets.uploading}
                            uploadFiles={imageAssets.uploadFiles}
                            manageHref="/admin/assets"
                            helpText="Choose a wide scene image. Uploaded files are available immediately in story node editors."
                            placeholder="/uploads/city-council-night.webp"
                        />

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                {editingId ? 'Save Background' : 'Create Background'}
                            </button>
                            {editingId && (
                                <button type="button" onClick={resetForm} className="btn btn-secondary">
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {loading ? (
                        <div className="animate-pulse" style={{ height: '220px', background: 'var(--glass-border)', borderRadius: '12px' }} />
                    ) : backgrounds.length === 0 ? (
                        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                            <p style={{ fontSize: '2rem', marginBottom: '1rem' }}>🖼️</p>
                            <p style={{ color: 'var(--text-muted)' }}>No backgrounds created yet.</p>
                        </div>
                    ) : (
                        backgrounds.map((background) => (
                            <div key={background.id} className="glass-panel" style={{ padding: '1.2rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '180px minmax(0, 1fr)', gap: '1rem', alignItems: 'start' }}>
                                    <div style={{ borderRadius: '16px', overflow: 'hidden', background: 'rgba(0,0,0,0.25)', aspectRatio: '16 / 9' }}>
                                        <img src={background.imageUrl} alt={background.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'start', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                                            <div>
                                                <h3 style={{ fontSize: '1.05rem', marginBottom: '0.2rem' }}>{background.name}</h3>
                                                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>{background.imageUrl}</p>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.45rem' }}>
                                                <button type="button" className="btn btn-secondary" onClick={() => handleEdit(background)} style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}>
                                                    Edit
                                                </button>
                                                <button type="button" className="btn btn-danger" onClick={() => handleDelete(background.id)} style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}>
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                            Reusable in both the classic node editor and the flow editor.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
