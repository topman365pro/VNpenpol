import Link from 'next/link';
import { getSiteSettings, listStories } from '@/lib/data-store';
import { getPublicCopy } from '@/lib/public-copy';

interface Story {
    id: string;
    title: string;
    description: string | null;
    nodes: { id: string }[];
}

export const dynamic = 'force-dynamic';

export default async function PlayPage() {
    const { publicLocale } = await getSiteSettings();
    const copy = getPublicCopy(publicLocale);
    const stories = await listStories() as Story[];

    return (
        <div style={{ minHeight: '100vh', padding: '3rem 2rem' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <Link href="/" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{copy.playList.backHome}</Link>
                    <h1 className="text-gradient" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', marginTop: '1rem' }}>
                        {copy.playList.heading}
                    </h1>
                    <p style={{ color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '0.75rem' }}>
                        PILAR · {copy.brand.expansion}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginTop: '0.5rem' }}>
                        {copy.playList.subheading}
                    </p>
                </div>

                {stories.length === 0 ? (
                    <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center' }}>
                        <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>📖</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>{copy.playList.emptyTitle}</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>{copy.playList.emptyDescription}</p>
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
                                        {story.description || copy.playList.fallbackDescription}
                                    </p>
                                    <span className="badge badge-secondary" style={{ marginTop: '0.75rem' }}>
                                        {copy.playList.sceneCount(story.nodes.length)}
                                    </span>
                                </div>
                                <div className="btn btn-primary" style={{ flexShrink: 0 }}>
                                    {copy.playList.playButton}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
