export default function AdminPage() {
    return (
        <div>
            <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Admin Dashboard</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '3rem' }}>
                Manage stories, reusable scene backgrounds, character art, uploaded assets, and player scores.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                <a href="/admin/stories" className="glass-panel" style={{ padding: '2rem', display: 'block', border: '1px solid var(--primary)' }}>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Stories</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Create new storylines, edit existing ones, and manage dialogue nodes.</p>
                </a>
                <a href="/admin/characters" className="glass-panel" style={{ padding: '2rem', display: 'block', border: '1px solid var(--secondary)' }}>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Characters</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Manage the politicians and speakers in your visual novel.</p>
                </a>
                <a href="/admin/backgrounds" className="glass-panel" style={{ padding: '2rem', display: 'block', border: '1px solid rgba(103, 232, 249, 0.5)' }}>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Backgrounds</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Create reusable scene backdrops with upload support and assign them by name inside node editors.</p>
                </a>
                <a href="/admin/leaderboard" className="glass-panel" style={{ padding: '2rem', display: 'block', border: '1px solid var(--accent)' }}>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Leaderboard</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Rename players, fix scores, add entries, and remove records directly from admin.</p>
                </a>
                <a href="/admin/assets" className="glass-panel" style={{ padding: '2rem', display: 'block', border: '1px solid rgba(255, 255, 255, 0.16)' }}>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Assets</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Browse every uploaded image and audio file, filter the library, copy URLs, and clean out unused uploads.</p>
                </a>
            </div>
        </div>
    )
}
