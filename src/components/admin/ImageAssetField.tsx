'use client';

/* eslint-disable @next/next/no-img-element */
import { useState } from 'react';
import type { AssetRecord } from '@/lib/asset-utils';
import AssetBrowser from '@/components/admin/AssetBrowser';
import AssetUploadButton from '@/components/admin/AssetUploadButton';

interface UploadedAsset {
    url: string;
    name: string;
    size: number;
}

interface ImageAssetFieldProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    assets: AssetRecord[];
    uploading?: boolean;
    uploadFiles: (files: File[]) => Promise<UploadedAsset[]>;
    placeholder?: string;
    helpText?: string;
    manageHref?: string;
}

export default function ImageAssetField({
    label,
    value,
    onChange,
    assets,
    uploading = false,
    uploadFiles,
    placeholder = '/uploads/example-image.png',
    helpText,
    manageHref,
}: ImageAssetFieldProps) {
    const [browserOpen, setBrowserOpen] = useState(false);

    async function handleUpload(files: File[]) {
        const uploaded = await uploadFiles(files);
        if (uploaded[0]) {
            onChange(uploaded[0].url);
        }
    }

    return (
        <div>
            <label style={{ marginBottom: '0.35rem' }}>{label}</label>
            <div style={{ display: 'grid', gridTemplateColumns: '84px minmax(0, 1fr)', gap: '0.8rem', alignItems: 'start' }}>
                <div style={{
                    width: '84px',
                    height: '112px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: 'rgba(0,0,0,0.25)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    display: 'grid',
                    placeItems: 'center',
                }}>
                    {value ? (
                        <img src={value} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Preview</span>
                    )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <input
                        type="text"
                        value={value}
                        onChange={(event) => onChange(event.target.value)}
                        placeholder={placeholder}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <AssetUploadButton
                            label="Upload Image"
                            uploading={uploading}
                            accept="image/*"
                            onFilesSelected={handleUpload}
                            style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem' }}
                        />
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setBrowserOpen((open) => !open)}
                            style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem' }}
                        >
                            {browserOpen ? 'Hide Library' : 'Browse Library'}
                        </button>
                        {value && (
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => onChange('')}
                                style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem' }}
                            >
                                Clear
                            </button>
                        )}
                        {manageHref && (
                            <a href={manageHref} className="btn btn-secondary" style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem' }}>
                                Manage
                            </a>
                        )}
                    </div>
                    {helpText && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {helpText}
                        </p>
                    )}
                </div>
            </div>
            {browserOpen && (
                <div style={{ marginTop: '0.75rem' }}>
                    <AssetBrowser
                        assets={assets}
                        kind="image"
                        onSelect={(url) => onChange(url)}
                        selectedUrl={value}
                        emptyMessage="No image uploads available yet."
                    />
                </div>
            )}
        </div>
    );
}
