'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import AssetBrowser from '@/components/admin/AssetBrowser';
import AssetUploadButton from '@/components/admin/AssetUploadButton';
import { useAssetLibrary } from '@/components/admin/use-asset-library';
import { deriveAssetLabel } from '@/lib/asset-utils';

interface MusicTrackRecord {
    id: string;
    name: string;
    audioUrl: string;
}

export default function MusicAdminPage() {
    const [musicTracks, setMusicTracks] = useState<MusicTrackRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [audioUrl, setAudioUrl] = useState('');
    const [browserOpen, setBrowserOpen] = useState(false);
    const audioAssets = useAssetLibrary('audio');

    const fetchMusicTracks = useCallback(async () => {
        setLoading(true);
        const response = await fetch('/api/music-tracks');
        if (response.ok) {
            setMusicTracks(await response.json());
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchMusicTracks();
        }, 0);
        return () => clearTimeout(timer);
    }, [fetchMusicTracks]);

    function resetForm() {
        setEditingId(null);
        setName('');
        setAudioUrl('');
        setBrowserOpen(false);
    }

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        const trimmedName = name.trim();
        const trimmedAudioUrl = audioUrl.trim();
        if (!trimmedName || !trimmedAudioUrl) {
            return;
        }

        const response = await fetch(editingId ? `/api/music-tracks/${editingId}` : '/api/music-tracks', {
            method: editingId ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: trimmedName,
                audioUrl: trimmedAudioUrl,
            }),
        });

        if (response.ok) {
            resetForm();
            fetchMusicTracks();
        }
    }

    function handleEdit(track: MusicTrackRecord) {
        setEditingId(track.id);
        setName(track.name);
        setAudioUrl(track.audioUrl);
        window.scrollTo(0, 0);
    }

    async function handleDelete(id: string) {
        if (!confirm('Delete this music track? Stories and nodes using it will fall back to no background music.')) {
            return;
        }

        const response = await fetch(`/api/music-tracks/${id}`, { method: 'DELETE' });
        if (response.ok) {
            if (editingId === id) {
                resetForm();
            }
            fetchMusicTracks();
        }
    }

    async function handleUpload(files: File[]) {
        const uploaded = await audioAssets.uploadFiles(files.slice(0, 1));
        const firstUpload = uploaded[0];
        if (!firstUpload) {
            return;
        }
        setAudioUrl(firstUpload.url);
        setName((current) => current.trim() ? current : deriveAssetLabel(firstUpload.url, 'Music Track'));
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                    <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '0.35rem' }}>Music</h1>
                    <p style={{ color: 'var(--text-muted)' }}>
                        Create reusable background music tracks, upload audio once, and switch BGM from stories or individual nodes.
                    </p>
                </div>
                <Link href="/admin/assets" className="btn btn-secondary">
                    Open Asset Library
                </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(360px, 1fr) 1.7fr', gap: '2rem' }}>
                <div className="glass-panel" style={{ padding: '2rem', height: 'fit-content' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>{editingId ? 'Edit Music Track' : 'Create Music Track'}</h3>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                placeholder="Merdeka Hall Theme"
                                required
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Audio Track</label>
                            <div style={{
                                padding: '0.9rem',
                                borderRadius: '12px',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.08)',
                            }}>
                                {audioUrl ? (
                                    <>
                                        <audio controls src={audioUrl} style={{ width: '100%' }} />
                                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.45rem', wordBreak: 'break-all' }}>{audioUrl}</p>
                                    </>
                                ) : (
                                    <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>No audio assigned yet.</p>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.65rem' }}>
                                <AssetUploadButton
                                    label={audioUrl ? 'Replace Music' : 'Upload Music'}
                                    uploading={audioAssets.uploading}
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
                                {audioUrl && (
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setAudioUrl('')}
                                        style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem' }}
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                            {browserOpen && (
                                <div style={{ marginTop: '0.75rem' }}>
                                    <AssetBrowser
                                        assets={audioAssets.assets}
                                        kind="audio"
                                        onSelect={(url) => {
                                            setAudioUrl(url);
                                            setName((current) => current.trim() ? current : deriveAssetLabel(url, 'Music Track'));
                                        }}
                                        selectedUrl={audioUrl}
                                        emptyMessage="No uploaded audio files available yet."
                                    />
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                {editingId ? 'Save Track' : 'Create Track'}
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
                    ) : musicTracks.length === 0 ? (
                        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                            <p style={{ fontSize: '2rem', marginBottom: '1rem' }}>🎵</p>
                            <p style={{ color: 'var(--text-muted)' }}>No music tracks created yet.</p>
                        </div>
                    ) : (
                        musicTracks.map((track) => (
                            <div key={track.id} className="glass-panel" style={{ padding: '1.2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'start', flexWrap: 'wrap' }}>
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                        <h3 style={{ fontSize: '1.05rem', marginBottom: '0.2rem' }}>{track.name}</h3>
                                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', wordBreak: 'break-all', marginBottom: '0.8rem' }}>{track.audioUrl}</p>
                                        <audio controls src={track.audioUrl} style={{ width: '100%' }} />
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.45rem' }}>
                                        <button type="button" className="btn btn-secondary" onClick={() => handleEdit(track)} style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}>
                                            Edit
                                        </button>
                                        <button type="button" className="btn btn-danger" onClick={() => handleDelete(track.id)} style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}>
                                            Delete
                                        </button>
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
