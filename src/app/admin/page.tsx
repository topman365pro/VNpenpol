export default function AdminPage() {
    return (
        <div>
            <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Admin Dashboard</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '3rem' }}>
                Manage stories, dialogue nodes, characters, and view player scores.
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
            </div>
        </div>
    )
}
