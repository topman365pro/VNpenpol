'use client';

/* eslint-disable @next/next/no-img-element */
import type { AssetKind, AssetRecord } from '@/lib/asset-utils';
import { formatAssetSize, isAudioAsset, isImageAsset, prettyUploadedAssetName } from '@/lib/asset-utils';

interface AssetBrowserProps {
    assets: AssetRecord[];
    kind: AssetKind;
    onSelect?: (url: string) => void;
    selectedUrl?: string | null;
    selectLabel?: string;
    emptyMessage?: string;
    maxHeight?: string;
}

export default function AssetBrowser({
    assets,
    kind,
    onSelect,
    selectedUrl,
    selectLabel = 'Use',
    emptyMessage,
    maxHeight = '280px',
}: AssetBrowserProps) {
    const filteredAssets = assets.filter((asset) => (kind === 'image' ? isImageAsset(asset.name) : isAudioAsset(asset.name)));

    if (filteredAssets.length === 0) {
        return (
            <div style={{ padding: '1rem', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.12)' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {emptyMessage || `No ${kind} assets uploaded yet.`}
                </p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight, overflowY: 'auto', paddingRight: '0.2rem' }}>
            {filteredAssets.map((asset) => (
                <div
                    key={asset.name}
                    style={{
                        padding: '0.8rem',
                        borderRadius: '14px',
                        background: 'rgba(255,255,255,0.03)',
                        border: asset.url === selectedUrl ? '1px solid rgba(103, 232, 249, 0.45)' : '1px solid rgba(255,255,255,0.08)',
                    }}
                >
                    <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                        <div style={{
                            width: '68px',
                            height: '68px',
                            flexShrink: 0,
                            borderRadius: '12px',
                            background: 'rgba(0,0,0,0.25)',
                            overflow: 'hidden',
                            display: 'grid',
                            placeItems: 'center',
                        }}>
                            {kind === 'image' ? (
                                <img src={asset.url} alt={asset.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Audio</span>
                            )}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {prettyUploadedAssetName(asset.name)}
                            </p>
                            <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                {formatAssetSize(asset.size)}
                            </p>
                            {kind === 'audio' && (
                                <audio controls src={asset.url} style={{ width: '100%', marginTop: '0.45rem' }} />
                            )}
                        </div>
                    </div>
                    {onSelect && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => onSelect(asset.url)}
                                style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem' }}
                            >
                                {asset.url === selectedUrl ? 'Selected' : selectLabel}
                            </button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
