import Link from 'next/link';
import PublicLanguageControl from '@/components/admin/PublicLanguageControl';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
            <header style={{
                padding: '1rem 2rem',
                borderBottom: '1px solid var(--glass-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem',
                flexWrap: 'wrap',
                background: 'var(--bg-darker)'
            }}>
                <h2 style={{ marginBottom: 0 }}>Admin Dashboard</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <nav style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                        <Link href="/admin/stories" style={{ fontWeight: 500 }}>Stories</Link>
                        <Link href="/admin/characters" style={{ fontWeight: 500 }}>Characters</Link>
                        <Link href="/admin/backgrounds" style={{ fontWeight: 500 }}>Backgrounds</Link>
                        <Link href="/admin/music" style={{ fontWeight: 500 }}>Music</Link>
                        <Link href="/admin/leaderboard" style={{ fontWeight: 500 }}>Leaderboard</Link>
                        <Link href="/admin/assets" style={{ fontWeight: 500 }}>Assets</Link>
                        <Link href="/" style={{ color: 'var(--text-muted)' }}>Back to Site</Link>
                    </nav>
                    <PublicLanguageControl />
                </div>
            </header>
            <main style={{ flex: 1, padding: '2rem', maxWidth: '1480px', margin: '0 auto', width: '100%' }}>
                {children}
            </main>
        </div>
    );
}
