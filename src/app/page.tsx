'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function HomePage() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => { setMounted(true); }, 0);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '2rem' }}>
            {/* Animated background orbs */}
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

            {/* Hero */}
            <div style={{
                textAlign: 'center', zIndex: 1, maxWidth: '700px',
                opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(30px)',
                transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
            }}>
                <div style={{ marginBottom: '1rem' }}>
                    <span className="badge badge-accent" style={{ fontSize: '0.8rem', padding: '0.3rem 1rem' }}>
                        🎮 Interactive Political Education
                    </span>
                </div>
                <h1 className="text-gradient" style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', marginBottom: '1.5rem', lineHeight: 1.1, fontWeight: 800 }}>
                    Political Crossroads
                </h1>
                <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '3rem', lineHeight: 1.7 }}>
                    Navigate the world of political debates, make tough choices, and discover where you stand.
                    An interactive visual novel experience.
                </p>
            </div>

            {/* Navigation Cards */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem',
                maxWidth: '960px', width: '100%', zIndex: 1,
                opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(40px)',
                transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s',
            }}>
                <Link href="/play" className="glass-panel" style={{
                    padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center',
                    textAlign: 'center', textDecoration: 'none', border: '1px solid rgba(124,58,237,0.3)',
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎭</div>
                    <h3 style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>Play Now</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                        Jump into a story, make choices, and see your political compass unfold.
                    </p>
                </Link>

                <Link href="/leaderboard" className="glass-panel" style={{
                    padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center',
                    textAlign: 'center', textDecoration: 'none', border: '1px solid rgba(6,182,212,0.3)',
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏆</div>
                    <h3 style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>Leaderboard</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                        See how your political savvy compares to other players.
                    </p>
                </Link>

                <Link href="/admin" className="glass-panel" style={{
                    padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center',
                    textAlign: 'center', textDecoration: 'none', border: '1px solid rgba(245,158,11,0.3)',
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚙️</div>
                    <h3 style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>Admin Dashboard</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                        Create stories, manage characters, and craft dialogue trees.
                    </p>
                </Link>
            </div>

            {/* Footer */}
            <footer style={{
                marginTop: '4rem', textAlign: 'center', zIndex: 1,
                opacity: mounted ? 1 : 0, transition: 'opacity 1s ease 0.5s',
            }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Built for political education — learn through interactive storytelling.
                </p>
            </footer>
        </div>
    );
}
