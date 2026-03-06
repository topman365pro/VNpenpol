'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Story {
    id: string;
    title: string;
    description: string | null;
    nodes: { id: string }[];
}

export default function PlayPage() {
    const [stories, setStories] = useState<Story[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const res = await fetch('/api/stories');
            if (res.ok) setStories(await res.json());
            setLoading(false);
        })();
    }, []);

    return (
        <div style={{ minHeight: '100vh', padding: '3rem 2rem' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <Link href="/" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>← Home</Link>
                    <h1 className="text-gradient" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', marginTop: '1rem' }}>
                        Choose Your Story
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginTop: '0.5rem' }}>
                        Pick a political scenario and make your choices wisely.
                    </p>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {[1, 2, 3].map(i => (
                            <div key={i} className="animate-pulse" style={{ height: '120px', background: 'var(--glass-border)', borderRadius: '16px' }} />
                        ))}
                    </div>
                ) : stories.length === 0 ? (
                    <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center' }}>
                        <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>📖</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>No stories available yet.</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Check back later or ask an admin to create one!</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {stories.map((story, index) => (
                            <Link
                                key={story.id}
                                href={`/play/${story.id}`}
                                className="glass-panel"
                                style={{
                                    padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    textDecoration: 'none', gap: '1.5rem',
                                    opacity: 0, animation: `fadeIn 0.5s ease forwards ${index * 0.1}s`,
                                }}
                            >
                                <div>
                                    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{story.title}</h2>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                                        {story.description || 'An interactive political scenario awaits.'}
                                    </p>
                                    <span className="badge badge-secondary" style={{ marginTop: '0.75rem' }}>
                                        {story.nodes.length} scene{story.nodes.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                                <div className="btn btn-primary" style={{ flexShrink: 0 }}>
                                    Play →
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
