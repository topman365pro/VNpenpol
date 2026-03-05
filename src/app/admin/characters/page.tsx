'use client';
import { useState, useEffect } from 'react';
import { Character } from '@prisma/client';

export default function CharactersAdmin() {
    const [characters, setCharacters] = useState<Character[]>([]);
    const [name, setName] = useState('');
    const [spriteImageUrl, setSpriteImageUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);

    const fetchCharacters = async () => {
        setLoading(true);
        const res = await fetch('/api/characters');
        if (res.ok) {
            const data = await res.json();
            setCharacters(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchCharacters();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;

        if (editingId) {
            const res = await fetch(`/api/characters/${editingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, spriteImageUrl }),
            });
            if (res.ok) {
                setEditingId(null);
                setName('');
                setSpriteImageUrl('');
                fetchCharacters();
            }
        } else {
            const res = await fetch('/api/characters', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, spriteImageUrl }),
            });

            if (res.ok) {
                setName('');
                setSpriteImageUrl('');
                fetchCharacters();
            }
        }
    };

    const handleEdit = (char: Character) => {
        setEditingId(char.id);
        setName(char.name);
        setSpriteImageUrl(char.spriteImageUrl || '');
        window.scrollTo(0, 0);
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        if (!confirm('Are you sure you want to delete this character?')) return;
        const res = await fetch(`/api/characters/${id}`, { method: 'DELETE' });
        if (res.ok) {
            if (editingId === id) {
                setEditingId(null);
                setName('');
                setSpriteImageUrl('');
            }
            fetchCharacters();
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 className="text-gradient" style={{ fontSize: '2rem' }}>Characters</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '2rem' }}>
                <div className="glass-panel" style={{ padding: '2rem', height: 'fit-content' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>{editingId ? 'Edit Character' : 'Create New Character'}</h3>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                                required
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Sprite Image URL (Optional)</label>
                            <input
                                type="text"
                                value={spriteImageUrl}
                                onChange={(e) => setSpriteImageUrl(e.target.value)}
                                placeholder="/characters/senator-smith.png"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                            />
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                For local files, place them in the <code>public</code> directory and start URL with <code>/</code>
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingId ? 'Update Character' : 'Add Character'}</button>
                            {editingId && (
                                <button type="button" onClick={() => { setEditingId(null); setName(''); setSpriteImageUrl(''); }} className="btn btn-secondary" style={{ flex: 1 }}>
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                <div>
                    {loading ? (
                        <div className="animate-pulse" style={{ height: '100px', background: 'var(--glass-border)', borderRadius: '8px' }}></div>
                    ) : characters.length === 0 ? (
                        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
                            <p style={{ color: 'var(--text-muted)' }}>No characters defined yet.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                            {characters.map(char => (
                                <div key={char.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                                    <div style={{
                                        width: '80px',
                                        height: '80px',
                                        borderRadius: '50%',
                                        background: 'var(--glass-border)',
                                        marginBottom: '1rem',
                                        overflow: 'hidden',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        {char.spriteImageUrl ? (
                                            <img src={char.spriteImageUrl} alt={char.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <span style={{ fontSize: '2rem', color: 'var(--text-muted)' }}>?</span>
                                        )}
                                    </div>
                                    <h3 style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>{char.name}</h3>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                        <button onClick={() => handleEdit(char)} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>Edit</button>
                                        <button onClick={(e) => handleDelete(char.id, e)} className="btn btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', background: 'rgba(255, 50, 50, 0.2)', border: '1px solid rgba(255, 50, 50, 0.5)', color: '#ff6b6b' }}>Delete</button>
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
