import Link from 'next/link';
import { getSiteSettings } from '@/lib/data-store';
import { getPublicCopy } from '@/lib/public-copy';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
    const { publicLocale } = await getSiteSettings();
    const copy = getPublicCopy(publicLocale);

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '2rem' }}>
            <div style={{
                position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
            }}>
                <div style={{
                    position: 'absolute', width: '400px', height: '400px', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(124,58,237,0.15), transparent 70%)',
                    top: '10%', left: '15%',
                    animation: 'pulse 6s ease-in-out infinite',
                }} />
                <div style={{
                    position: 'absolute', width: '350px', height: '350px', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(6,182,212,0.12), transparent 70%)',
                    bottom: '15%', right: '10%',
                    animation: 'pulse 8s ease-in-out infinite 1s',
                }} />
                <div style={{
                    position: 'absolute', width: '250px', height: '250px', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(245,158,11,0.08), transparent 70%)',
                    top: '50%', left: '60%',
                    animation: 'pulse 7s ease-in-out infinite 2s',
                }} />
            </div>

            <div style={{
                textAlign: 'center', zIndex: 1, maxWidth: '700px',
            }}>
                <div style={{ marginBottom: '1rem' }}>
                    <span className="badge badge-accent" style={{ fontSize: '0.8rem', padding: '0.3rem 1rem' }}>
                        {copy.brand.badge}
                    </span>
                </div>
                <h1 className="text-gradient" style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', marginBottom: '1.5rem', lineHeight: 1.1, fontWeight: 800 }}>
                    {copy.brand.name}
                </h1>
                <p style={{ color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.9rem' }}>
                    {copy.brand.expansion}
                </p>
                <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '3rem', lineHeight: 1.7 }}>
                    {copy.home.description}
                </p>
            </div>

            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem',
                maxWidth: '960px', width: '100%', zIndex: 1,
            }}>
                <Link href="/play" className="glass-panel" style={{
                    padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center',
                    textAlign: 'center', textDecoration: 'none', border: '1px solid rgba(124,58,237,0.3)',
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎭</div>
                    <h3 style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>{copy.home.playTitle}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                        {copy.home.playDescription}
                    </p>
                </Link>

                <Link href="/leaderboard" className="glass-panel" style={{
                    padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center',
                    textAlign: 'center', textDecoration: 'none', border: '1px solid rgba(6,182,212,0.3)',
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏆</div>
                    <h3 style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>{copy.home.leaderboardTitle}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                        {copy.home.leaderboardDescription}
                    </p>
                </Link>

                <Link href="/admin" className="glass-panel" style={{
                    padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center',
                    textAlign: 'center', textDecoration: 'none', border: '1px solid rgba(245,158,11,0.3)',
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚙️</div>
                    <h3 style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>{copy.home.adminTitle}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                        {copy.home.adminDescription}
                    </p>
                </Link>
            </div>

            <footer style={{
                marginTop: '4rem', textAlign: 'center', zIndex: 1,
            }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {copy.home.footer}
                </p>
            </footer>
        </div>
    );
}
