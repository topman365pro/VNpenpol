'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface StoryRecord {
    id: string;
    title: string;
    description: string | null;
}

export default function StoriesAdmin() {
    const [stories, setStories] = useState<StoryRecord[]>([]);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);

    const fetchStories = useCallback(async () => {
        setLoading(true);
        const res = await fetch('/api/stories');
        if (res.ok) {
            const data = await res.json();
            setStories(data);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => { fetchStories(); }, 0);
        return () => clearTimeout(timer);
    }, [fetchStories]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title) return;

        if (editingId) {
            const res = await fetch(`/api/stories/${editingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description }),
            });
            if (res.ok) {
                setEditingId(null);
                setTitle('');
                setDescription('');
                fetchStories();
            }
        } else {
            const res = await fetch('/api/stories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description }),
            });

            if (res.ok) {
                setTitle('');
                setDescription('');
                fetchStories();
            }
        }
    };

    const handleEdit = (story: StoryRecord) => {
        setEditingId(story.id);
        setTitle(story.title);
        setDescription(story.description || '');
        window.scrollTo(0, 0);
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        if (!confirm('Are you sure you want to delete this story? All related nodes will be deleted.')) return;
        const res = await fetch(`/api/stories/${id}`, { method: 'DELETE' });
        if (res.ok) {
            if (editingId === id) {
                setEditingId(null);
                setTitle('');
                setDescription('');
            }
            fetchStories();
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 className="text-gradient" style={{ fontSize: '2rem' }}>Storylines</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '2rem' }}>
                <div className="glass-panel" style={{ padding: '2rem', height: 'fit-content' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>{editingId ? 'Edit Story' : 'Create New Story'}</h3>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                                required
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white', minHeight: '100px' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingId ? 'Update Story' : 'Create Story'}</button>
                            {editingId && (
                                <button type="button" onClick={() => { setEditingId(null); setTitle(''); setDescription(''); }} className="btn btn-secondary" style={{ flex: 1 }}>
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                <div>
                    {loading ? (
                        <div className="animate-pulse" style={{ height: '100px', background: 'var(--glass-border)', borderRadius: '8px' }}></div>
                    ) : stories.length === 0 ? (
                        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
                            <p style={{ color: 'var(--text-muted)' }}>No stories created yet.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {stories.map(story => (
                                <div key={story.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>{story.title}</h3>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{story.description || 'No description'}</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => handleEdit(story)} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                                            Edit
                                        </button>
                                        <Link href={`/admin/stories/${story.id}/flow`} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                                            Flow
                                        </Link>
                                        <Link href={`/admin/stories/${story.id}/nodes`} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                                            Nodes
                                        </Link>
                                        <button onClick={(e) => handleDelete(story.id, e)} className="btn btn-danger" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', background: 'rgba(255, 50, 50, 0.2)', border: '1px solid rgba(255, 50, 50, 0.5)', color: '#ff6b6b' }}>
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
