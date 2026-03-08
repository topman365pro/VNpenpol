import Link from 'next/link';
import { getSiteSettings, listLeaderboard } from '@/lib/runtime-store';
import { formatPublicDate, getPublicCopy } from '@/lib/public-copy';

interface ScoreEntry {
    id: string;
    name: string;
    score: number;
    createdAt: string;
}

export const dynamic = 'force-dynamic';

export default async function LeaderboardPage() {
    const { publicLocale } = await getSiteSettings();
    const copy = getPublicCopy(publicLocale);
    const scores = await listLeaderboard() as ScoreEntry[];

    const getMedal = (index: number) => {
        if (index === 0) return '🥇';
        if (index === 1) return '🥈';
        if (index === 2) return '🥉';
        return `#${index + 1}`;
    };

    return (
        <div style={{ minHeight: '100vh', padding: '3rem 2rem' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <Link href="/" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{copy.leaderboard.backHome}</Link>
                    <h1 className="text-gradient" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', marginTop: '1rem' }}>
                        🏆 {copy.leaderboard.heading}
                    </h1>
                    <p style={{ color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '0.75rem' }}>
                        PILAR · {copy.brand.expansion}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginTop: '0.5rem' }}>
                        {copy.leaderboard.subheading}
                    </p>
                </div>

                {scores.length === 0 ? (
                    <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center' }}>
                        <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏆</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>{copy.leaderboard.emptyTitle}</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>{copy.leaderboard.emptyDescription}</p>
                        <Link href="/play" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>{copy.leaderboard.playNow}</Link>
                    </div>
                ) : (
                    <div className="glass-panel" style={{ overflow: 'hidden' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th style={{ width: '60px', textAlign: 'center' }}>{copy.leaderboard.rank}</th>
                                    <th>{copy.leaderboard.player}</th>
                                    <th style={{ textAlign: 'right' }}>{copy.leaderboard.score}</th>
                                    <th style={{ textAlign: 'right' }}>{copy.leaderboard.date}</th>
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
                                            {formatPublicDate(entry.createdAt, publicLocale)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                    <Link href="/play" className="btn btn-primary">{copy.leaderboard.playStory}</Link>
                </div>
            </div>
        </div>
    );
}
