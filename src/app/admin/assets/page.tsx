'use client';

/* eslint-disable @next/next/no-img-element */
import { useMemo, useState } from 'react';
import AssetUploadButton from '@/components/admin/AssetUploadButton';
import { useAssetLibrary } from '@/components/admin/use-asset-library';
import type { AssetKind } from '@/lib/asset-utils';
import { formatAssetSize, isAudioAsset, isImageAsset, prettyUploadedAssetName } from '@/lib/asset-utils';

type AssetFilter = 'all' | AssetKind;

const filterOptions: Array<{ value: AssetFilter; label: string }> = [
    { value: 'all', label: 'All assets' },
    { value: 'image', label: 'Images' },
    { value: 'audio', label: 'Audio' },
];

export default function AssetsAdmin() {
    const [filter, setFilter] = useState<AssetFilter>('all');
    const [copied, setCopied] = useState<string | null>(null);
    const assetLibrary = useAssetLibrary(filter === 'all' ? undefined : filter);

    const imageCount = useMemo(
        () => assetLibrary.assets.filter((asset) => isImageAsset(asset.name)).length,
        [assetLibrary.assets]
    );
    const audioCount = useMemo(
        () => assetLibrary.assets.filter((asset) => isAudioAsset(asset.name)).length,
        [assetLibrary.assets]
    );

    async function handleDelete(name: string) {
        if (!confirm(`Delete ${prettyUploadedAssetName(name)}?`)) {
            return;
        }

        const response = await fetch('/api/assets', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
        });

        if (response.ok) {
            await assetLibrary.refreshAssets();
        }
    }

    async function handleCopy(url: string) {
        await navigator.clipboard.writeText(url);
        setCopied(url);
        setTimeout(() => setCopied(null), 2000);
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '0.3rem' }}>Asset Library</h1>
                    <p style={{ color: 'var(--text-muted)' }}>
                        Canonical upload browser for images and audio used by sprites, backgrounds, and node soundtracks.
                    </p>
                </div>
                <AssetUploadButton
                    label="Upload Files"
                    loadingLabel="Uploading..."
                    uploading={assetLibrary.uploading}
                    accept="image/*,audio/*"
                    multiple
                    onFilesSelected={assetLibrary.uploadFiles}
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.9rem', marginBottom: '1.5rem' }}>
                <div className="glass-panel" style={{ padding: '1rem 1.2rem' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Showing</p>
                    <p style={{ fontSize: '1.9rem', fontWeight: 800 }}>{assetLibrary.assets.length}</p>
                </div>
                <div className="glass-panel" style={{ padding: '1rem 1.2rem' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Images</p>
                    <p style={{ fontSize: '1.9rem', fontWeight: 800 }}>{filter === 'audio' ? 0 : imageCount}</p>
                </div>
                <div className="glass-panel" style={{ padding: '1rem 1.2rem' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Audio</p>
                    <p style={{ fontSize: '1.9rem', fontWeight: 800 }}>{filter === 'image' ? 0 : audioCount}</p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                {filterOptions.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        className={filter === option.value ? 'btn btn-primary' : 'btn btn-secondary'}
                        onClick={() => setFilter(option.value)}
                        style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
                    >
                        {option.label}
                    </button>
                ))}
            </div>

            {assetLibrary.loading ? (
                <div className="animate-pulse" style={{ height: '240px', background: 'var(--glass-border)', borderRadius: '12px' }} />
            ) : assetLibrary.assets.length === 0 ? (
                <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center' }}>
                    <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>📁</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>
                        No {filter === 'all' ? '' : `${filter} `}assets uploaded yet.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
                    {assetLibrary.assets.map((asset) => {
                        const isImage = isImageAsset(asset.name);
                        const isAudio = isAudioAsset(asset.name);
                        return (
                            <div key={asset.name} className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                <div style={{
                                    height: '154px',
                                    borderRadius: '16px',
                                    background: 'rgba(0,0,0,0.28)',
                                    overflow: 'hidden',
                                    display: 'grid',
                                    placeItems: 'center',
                                }}>
                                    {isImage ? (
                                        <img src={asset.url} alt={asset.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : isAudio ? (
                                        <div style={{ width: '100%', padding: '1rem' }}>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.8rem', textAlign: 'center' }}>Audio preview</p>
                                            <audio controls src={asset.url} style={{ width: '100%' }} />
                                        </div>
                                    ) : (
                                        <span style={{ color: 'var(--text-muted)' }}>File</span>
                                    )}
                                </div>

                                <div style={{ minWidth: 0 }}>
                                    <p style={{ fontSize: '0.9rem', fontWeight: 600, wordBreak: 'break-word' }}>
                                        {prettyUploadedAssetName(asset.name)}
                                    </p>
                                    <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                        {formatAssetSize(asset.size)}
                                    </p>
                                    <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.25rem', wordBreak: 'break-all' }}>
                                        {asset.url}
                                    </p>
                                </div>

                                <div style={{ display: 'flex', gap: '0.45rem', marginTop: 'auto' }}>
                                    <button type="button" className="btn btn-secondary" onClick={() => handleCopy(asset.url)} style={{ flex: 1, padding: '0.35rem 0.7rem', fontSize: '0.78rem' }}>
                                        {copied === asset.url ? 'Copied' : 'Copy URL'}
                                    </button>
                                    <button type="button" className="btn btn-danger" onClick={() => handleDelete(asset.name)} style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem' }}>
                                        Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
