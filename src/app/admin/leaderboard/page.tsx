'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface LeaderboardEntry {
    id: string;
    name: string;
    score: number;
    createdAt: string;
}

function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

export default function LeaderboardAdminPage() {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [score, setScore] = useState(0);

    async function fetchEntries(preferredEntryId?: string | null) {
        setLoading(true);
        const response = await fetch('/api/admin/leaderboard');
        if (response.ok) {
            const data: LeaderboardEntry[] = await response.json();
            setEntries(data);

            const preferredEntry = preferredEntryId ? data.find((entry) => entry.id === preferredEntryId) : null;
            if (preferredEntry) {
                setEditingId(preferredEntry.id);
                setName(preferredEntry.name);
                setScore(preferredEntry.score);
            } else if (editingId && data.every((entry) => entry.id !== editingId)) {
                resetForm();
            }
        }
        setLoading(false);
    }

    useEffect(() => {
        fetchEntries();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function resetForm() {
        setEditingId(null);
        setName('');
        setScore(0);
    }

    function startEdit(entry: LeaderboardEntry) {
        setEditingId(entry.id);
        setName(entry.name);
        setScore(entry.score);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        if (!name.trim()) {
            return;
        }

        setSaving(true);
        const response = await fetch(editingId ? `/api/admin/leaderboard/${editingId}` : '/api/admin/leaderboard', {
            method: editingId ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                score: Number(score),
            }),
        });
        setSaving(false);

        if (!response.ok) {
            return;
        }

        const entry = await response.json();
        await fetchEntries(entry.id);
        if (!editingId) {
            resetForm();
        }
    }

    async function handleDelete(entry: LeaderboardEntry) {
        if (!confirm(`Delete leaderboard entry for ${entry.name}?`)) {
            return;
        }

        const response = await fetch(`/api/admin/leaderboard/${entry.id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            return;
        }

        await fetchEntries(editingId === entry.id ? null : editingId);
        if (editingId === entry.id) {
            resetForm();
        }
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <div>
                    <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '0.35rem' }}>Leaderboard Manager</h1>
                    <p style={{ color: 'var(--text-muted)' }}>
                        Rename players, adjust scores, add entries manually, or delete records you do not want to keep.
                    </p>
                </div>
                <Link href="/leaderboard" className="btn btn-secondary">
                    View Public Leaderboard
                </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 380px) minmax(0, 1fr)', gap: '1.5rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem', height: 'fit-content' }}>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
                        {editingId ? 'Edit Entry' : 'Add Entry'}
                    </h2>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label>Player Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                placeholder="Anonymous Voter"
                                required
                            />
                        </div>
                        <div>
                            <label>Score</label>
                            <input
                                type="number"
                                value={score}
                                onChange={(event) => setScore(Number(event.target.value))}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Entry'}
                            </button>
                            {editingId && (
                                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
                        <h2 style={{ fontSize: '1.2rem', marginBottom: 0 }}>Entries</h2>
                        <span className="badge badge-secondary">{entries.length} entries</span>
                    </div>

                    {loading ? (
                        <div className="animate-pulse" style={{ height: '160px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)' }} />
                    ) : entries.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)' }}>No leaderboard entries yet.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                            {entries.map((entry, index) => (
                                <div key={entry.id} style={{
                                    display: 'grid',
                                    gridTemplateColumns: '72px minmax(0, 1fr) auto',
                                    gap: '1rem',
                                    padding: '1rem',
                                    borderRadius: '16px',
                                    border: editingId === entry.id ? '1px solid rgba(167, 139, 250, 0.55)' : '1px solid rgba(255,255,255,0.08)',
                                    background: editingId === entry.id ? 'rgba(124, 58, 237, 0.12)' : 'rgba(255,255,255,0.03)',
                                    alignItems: 'center',
                                }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Rank</div>
                                        <div style={{ fontSize: '1.35rem', fontWeight: 800 }}>#{index + 1}</div>
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <p style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{entry.name}</p>
                                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{formatDate(entry.createdAt)}</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                        <span className={`badge ${entry.score >= 0 ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.82rem' }}>
                                            {entry.score >= 0 ? '+' : ''}{entry.score}
                                        </span>
                                        <button type="button" className="btn btn-secondary" onClick={() => startEdit(entry)} style={{ padding: '0.4rem 0.75rem', fontSize: '0.82rem' }}>
                                            Edit
                                        </button>
                                        <button type="button" className="btn btn-danger" onClick={() => handleDelete(entry)} style={{ padding: '0.4rem 0.75rem', fontSize: '0.82rem' }}>
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
