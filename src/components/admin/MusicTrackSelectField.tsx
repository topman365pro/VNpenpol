'use client';

import { useState } from 'react';
import AssetUploadButton from '@/components/admin/AssetUploadButton';

interface MusicTrackRecord {
    id: string;
    name: string;
    audioUrl: string;
}

interface MusicTrackSelectFieldProps {
    label?: string;
    noneLabel?: string;
    musicTracks: MusicTrackRecord[];
    value: string;
    onChange: (musicTrackId: string) => void;
    onQuickCreate: (files: File[]) => Promise<string | null>;
}

export default function MusicTrackSelectField({
    label = 'Background Music',
    noneLabel = 'None',
    musicTracks,
    value,
    onChange,
    onQuickCreate,
}: MusicTrackSelectFieldProps) {
    const [browserOpen, setBrowserOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const selectedTrack = musicTracks.find((track) => track.id === value) ?? null;

    async function handleQuickUpload(files: File[]) {
        setUploading(true);
        const nextMusicTrackId = await onQuickCreate(files);
        if (nextMusicTrackId) {
            onChange(nextMusicTrackId);
        }
        setUploading(false);
    }

    return (
        <div>
            <label>{label}</label>
            <select value={value} onChange={(event) => onChange(event.target.value)}>
                <option value="">{noneLabel}</option>
                {musicTracks.map((track) => (
                    <option key={track.id} value={track.id}>
                        {track.name}
                    </option>
                ))}
            </select>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.65rem' }}>
                <AssetUploadButton
                    label="Upload Music"
                    uploading={uploading}
                    accept="audio/*"
                    onFilesSelected={handleQuickUpload}
                    style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem' }}
                />
                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setBrowserOpen((open) => !open)}
                    style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem' }}
                >
                    {browserOpen ? 'Hide Music' : 'Browse Music'}
                </button>
                <a href="/admin/music" className="btn btn-secondary" style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem' }}>
                    Manage Music
                </a>
            </div>

            {selectedTrack && (
                <div style={{
                    marginTop: '0.75rem',
                    padding: '0.85rem',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                }}>
                    <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)', marginBottom: '0.45rem' }}>{selectedTrack.name}</p>
                    <audio controls src={selectedTrack.audioUrl} style={{ width: '100%' }} />
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.45rem', wordBreak: 'break-all' }}>
                        {selectedTrack.audioUrl}
                    </p>
                </div>
            )}

            {browserOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.75rem', maxHeight: '280px', overflowY: 'auto', paddingRight: '0.2rem' }}>
                    {musicTracks.map((track) => (
                        <div
                            key={track.id}
                            style={{
                                padding: '0.8rem',
                                borderRadius: '14px',
                                background: 'rgba(255,255,255,0.03)',
                                border: track.id === value ? '1px solid rgba(103, 232, 249, 0.45)' : '1px solid rgba(255,255,255,0.08)',
                            }}
                        >
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.45rem' }}>{track.name}</p>
                            <audio controls src={track.audioUrl} style={{ width: '100%' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center', marginTop: '0.65rem' }}>
                                <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>{track.audioUrl}</p>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => onChange(track.id)}
                                    style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem', flexShrink: 0 }}
                                >
                                    {track.id === value ? 'Selected' : 'Use'}
                                </button>
                            </div>
                        </div>
                    ))}
                    {musicTracks.length === 0 && (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            No music tracks created yet.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
