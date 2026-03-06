'use client';

import { useState } from 'react';
import type { AssetRecord } from '@/lib/asset-utils';
import AssetBrowser from '@/components/admin/AssetBrowser';
import AssetUploadButton from '@/components/admin/AssetUploadButton';

interface UploadedAsset {
    url: string;
    name: string;
    size: number;
}

interface NodeAudioFieldProps {
    value: string;
    onChange: (value: string) => void;
    assets: AssetRecord[];
    uploading?: boolean;
    uploadFiles: (files: File[]) => Promise<UploadedAsset[]>;
}

export default function NodeAudioField({
    value,
    onChange,
    assets,
    uploading = false,
    uploadFiles,
}: NodeAudioFieldProps) {
    const [browserOpen, setBrowserOpen] = useState(false);

    async function handleUpload(files: File[]) {
        const uploaded = await uploadFiles(files);
        if (uploaded[0]) {
            onChange(uploaded[0].url);
        }
    }

    return (
        <div>
            <label>Audio</label>
            <div style={{
                padding: '0.9rem',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
            }}>
                {value ? (
                    <>
                        <audio controls src={value} style={{ width: '100%' }} />
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.45rem' }}>{value}</p>
                    </>
                ) : (
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>No audio assigned to this node.</p>
                )}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.65rem' }}>
                <AssetUploadButton
                    label={value ? 'Replace Audio' : 'Upload Audio'}
                    uploading={uploading}
                    accept="audio/*"
                    onFilesSelected={handleUpload}
                    style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem' }}
                />
                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setBrowserOpen((open) => !open)}
                    style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem' }}
                >
                    {browserOpen ? 'Hide Audio Library' : 'Browse Audio'}
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
            </div>
            {browserOpen && (
                <div style={{ marginTop: '0.75rem' }}>
                    <AssetBrowser
                        assets={assets}
                        kind="audio"
                        onSelect={(url) => onChange(url)}
                        selectedUrl={value}
                        emptyMessage="No uploaded audio files available yet."
                    />
                </div>
            )}
        </div>
    );
}
