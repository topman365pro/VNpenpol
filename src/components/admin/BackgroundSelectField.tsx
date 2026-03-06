'use client';

/* eslint-disable @next/next/no-img-element */
import { useState } from 'react';
import AssetUploadButton from '@/components/admin/AssetUploadButton';

interface BackgroundRecord {
    id: string;
    name: string;
    imageUrl: string;
}

interface BackgroundSelectFieldProps {
    backgrounds: BackgroundRecord[];
    value: string;
    onChange: (backgroundId: string) => void;
    onQuickCreate: (files: File[]) => Promise<string | null>;
}

export default function BackgroundSelectField({
    backgrounds,
    value,
    onChange,
    onQuickCreate,
}: BackgroundSelectFieldProps) {
    const [galleryOpen, setGalleryOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const selectedBackground = backgrounds.find((background) => background.id === value) ?? null;

    async function handleQuickUpload(files: File[]) {
        setUploading(true);
        const nextBackgroundId = await onQuickCreate(files);
        if (nextBackgroundId) {
            onChange(nextBackgroundId);
        }
        setUploading(false);
    }

    return (
        <div>
            <label>Background</label>
            <select value={value} onChange={(event) => onChange(event.target.value)}>
                <option value="">None</option>
                {backgrounds.map((background) => (
                    <option key={background.id} value={background.id}>
                        {background.name}
                    </option>
                ))}
            </select>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.65rem' }}>
                <AssetUploadButton
                    label="Upload Background"
                    uploading={uploading}
                    accept="image/*"
                    onFilesSelected={handleQuickUpload}
                    style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem' }}
                />
                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setGalleryOpen((open) => !open)}
                    style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem' }}
                >
                    {galleryOpen ? 'Hide Backgrounds' : 'Browse Backgrounds'}
                </button>
                <a href="/admin/backgrounds" className="btn btn-secondary" style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem' }}>
                    Manage Backgrounds
                </a>
            </div>

            {selectedBackground && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '84px minmax(0, 1fr)',
                    gap: '0.8rem',
                    alignItems: 'start',
                    marginTop: '0.75rem',
                    padding: '0.8rem',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                }}>
                    <div style={{
                        width: '84px',
                        height: '84px',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        border: '1px solid rgba(255,255,255,0.08)',
                    }}>
                        <img src={selectedBackground.imageUrl} alt={selectedBackground.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>{selectedBackground.name}</p>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{selectedBackground.imageUrl}</p>
                    </div>
                </div>
            )}

            {galleryOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.75rem', maxHeight: '280px', overflowY: 'auto', paddingRight: '0.2rem' }}>
                    {backgrounds.map((background) => (
                        <div
                            key={background.id}
                            style={{
                                padding: '0.8rem',
                                borderRadius: '14px',
                                background: 'rgba(255,255,255,0.03)',
                                border: background.id === value ? '1px solid rgba(103, 232, 249, 0.45)' : '1px solid rgba(255,255,255,0.08)',
                            }}
                        >
                            <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                                <div style={{
                                    width: '68px',
                                    height: '68px',
                                    flexShrink: 0,
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                }}>
                                    <img src={background.imageUrl} alt={background.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                <div style={{ minWidth: 0, flex: 1 }}>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{background.name}</p>
                                    <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{background.imageUrl}</p>
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => onChange(background.id)}
                                    style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem' }}
                                >
                                    {background.id === value ? 'Selected' : 'Use'}
                                </button>
                            </div>
                        </div>
                    ))}
                    {backgrounds.length === 0 && (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            No backgrounds created yet.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
