'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ScoreEntry {
    id: string;
    name: string;
    score: number;
    createdAt: string;
}

export default function LeaderboardPage() {
    const [scores, setScores] = useState<ScoreEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const res = await fetch('/api/leaderboard');
            if (res.ok) setScores(await res.json());
            setLoading(false);
        })();
    }, []);

    const getMedal = (index: number) => {
        if (index === 0) return '🥇';
        if (index === 1) return '🥈';
        if (index === 2) return '🥉';
        return `#${index + 1}`;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
        });
    };

    return (
        <div style={{ minHeight: '100vh', padding: '3rem 2rem' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <Link href="/" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>← Home</Link>
                    <h1 className="text-gradient" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', marginTop: '1rem' }}>
                        🏆 Leaderboard
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginTop: '0.5rem' }}>
                        Top political minds ranked by score.
                    </p>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="animate-pulse" style={{ height: '60px', background: 'var(--glass-border)', borderRadius: '10px' }} />
                        ))}
                    </div>
                ) : scores.length === 0 ? (
                    <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center' }}>
                        <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏆</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>No scores submitted yet.</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Be the first to play and top the leaderboard!</p>
                        <Link href="/play" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>Play Now</Link>
                    </div>
                ) : (
                    <div className="glass-panel" style={{ overflow: 'hidden' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th style={{ width: '60px', textAlign: 'center' }}>Rank</th>
                                    <th>Player</th>
                                    <th style={{ textAlign: 'right' }}>Score</th>
                                    <th style={{ textAlign: 'right' }}>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {scores.map((entry, index) => (
                                    <tr key={entry.id} style={{
                                        opacity: 0,
                                        animation: `fadeIn 0.3s ease forwards ${index * 0.05}s`,
                                    }}>
                                        <td style={{
                                            textAlign: 'center', fontSize: index < 3 ? '1.3rem' : '0.9rem',
                                            fontWeight: index < 3 ? 700 : 400,
                                        }}>
                                            {getMedal(index)}
                                        </td>
                                        <td style={{
                                            fontWeight: index < 3 ? 600 : 400,
                                            color: index < 3 ? 'var(--text-primary)' : 'var(--text-secondary)',
                                        }}>
                                            {entry.name}
                                        </td>
                                        <td style={{
                                            textAlign: 'right', fontWeight: 700, fontFamily: 'monospace', fontSize: '1rem',
                                            color: entry.score > 0 ? 'var(--success-light)' : entry.score < 0 ? 'var(--danger-light)' : 'var(--text-primary)',
                                        }}>
                                            {entry.score > 0 ? '+' : ''}{entry.score}
                                        </td>
                                        <td style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                            {formatDate(entry.createdAt)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                    <Link href="/play" className="btn btn-primary">Play a Story</Link>
                </div>
            </div>
        </div>
    );
}
