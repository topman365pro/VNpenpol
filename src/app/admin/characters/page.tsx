'use client';

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import ImageAssetField from '@/components/admin/ImageAssetField';
import { useAssetLibrary } from '@/components/admin/use-asset-library';

interface CharacterSprite {
    id: string;
    label: string;
    imageUrl: string;
    isDefault: boolean;
    sortOrder: number;
}

interface CharacterRecord {
    id: string;
    name: string;
    sprites: CharacterSprite[];
    defaultSprite: CharacterSprite | null;
}

interface SpriteDraft {
    localId: string;
    id?: string;
    label: string;
    imageUrl: string;
    isDefault: boolean;
}

function makeSpriteDraft(overrides?: Partial<SpriteDraft>): SpriteDraft {
    return {
        localId: crypto.randomUUID(),
        label: '',
        imageUrl: '',
        isDefault: false,
        ...overrides,
    };
}

function normalizeDraftDefaults(drafts: SpriteDraft[]) {
    if (drafts.length === 0) {
        return drafts;
    }

    const defaultIndex = drafts.findIndex((sprite) => sprite.isDefault);
    const nextDefaultIndex = defaultIndex >= 0 ? defaultIndex : 0;
    return drafts.map((sprite, index) => ({
        ...sprite,
        isDefault: index === nextDefaultIndex,
    }));
}

export default function CharactersAdmin() {
    const [characters, setCharacters] = useState<CharacterRecord[]>([]);
    const [name, setName] = useState('');
    const [sprites, setSprites] = useState<SpriteDraft[]>([makeSpriteDraft({ label: 'Default', isDefault: true })]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const imageAssets = useAssetLibrary('image');

    const fetchCharacters = useCallback(async () => {
        setLoading(true);
        const response = await fetch('/api/characters');
        if (response.ok) {
            setCharacters(await response.json());
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCharacters();
        }, 0);
        return () => clearTimeout(timer);
    }, [fetchCharacters]);

    function resetForm() {
        setEditingId(null);
        setName('');
        setSprites([makeSpriteDraft({ label: 'Default', isDefault: true })]);
    }

    function setSpriteField(localId: string, field: keyof Omit<SpriteDraft, 'localId' | 'id'>, value: string | boolean) {
        setSprites((current) => {
            const next = current.map((sprite) => {
                if (sprite.localId !== localId) {
                    return sprite;
                }

                if (field === 'isDefault') {
                    return {
                        ...sprite,
                        isDefault: Boolean(value),
                    };
                }

                return {
                    ...sprite,
                    [field]: String(value),
                };
            });

            return field === 'isDefault' && Boolean(value)
                ? next.map((sprite) => ({ ...sprite, isDefault: sprite.localId === localId }))
                : next;
        });
    }

    function addSprite() {
        setSprites((current) => normalizeDraftDefaults([
            ...current,
            makeSpriteDraft({ label: `Expression ${current.length + 1}` }),
        ]));
    }

    function removeSprite(localId: string) {
        setSprites((current) => normalizeDraftDefaults(current.filter((sprite) => sprite.localId !== localId)));
    }

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        if (!name.trim()) {
            return;
        }

        const payload = {
            name,
            sprites: sprites.map((sprite, index) => ({
                id: sprite.id,
                label: sprite.label,
                imageUrl: sprite.imageUrl,
                isDefault: sprite.isDefault,
                sortOrder: index,
            })),
        };

        const response = await fetch(editingId ? `/api/characters/${editingId}` : '/api/characters', {
            method: editingId ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (response.ok) {
            resetForm();
            fetchCharacters();
        }
    }

    function handleEdit(character: CharacterRecord) {
        setEditingId(character.id);
        setName(character.name);
        setSprites(normalizeDraftDefaults(character.sprites.map((sprite) => makeSpriteDraft({
            id: sprite.id,
            label: sprite.label,
            imageUrl: sprite.imageUrl,
            isDefault: sprite.isDefault,
        }))));
        window.scrollTo(0, 0);
    }

    async function handleDelete(id: string, event: React.MouseEvent) {
        event.preventDefault();
        if (!confirm('Are you sure you want to delete this character?')) {
            return;
        }

        const response = await fetch(`/api/characters/${id}`, { method: 'DELETE' });
        if (response.ok) {
            if (editingId === id) {
                resetForm();
            }
            fetchCharacters();
        }
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
                <h1 className="text-gradient" style={{ fontSize: '2rem' }}>Characters</h1>
                <Link href="/admin/assets" className="btn btn-secondary">
                    Open Asset Library
                </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(360px, 1fr) 1.7fr', gap: '2rem' }}>
                <div className="glass-panel" style={{ padding: '2rem', height: 'fit-content' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>{editingId ? 'Edit Character' : 'Create New Character'}</h3>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                                required
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                            <div>
                                <label style={{ marginBottom: '0.2rem' }}>Sprite Variants</label>
                                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                    Upload or browse image assets for each expression.
                                </p>
                            </div>
                            <button type="button" className="btn btn-secondary" onClick={addSprite} style={{ padding: '0.45rem 0.85rem' }}>
                                Add Sprite
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                            {sprites.map((sprite, index) => (
                                <div
                                    key={sprite.localId}
                                    style={{
                                        padding: '1rem',
                                        borderRadius: '14px',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        background: 'rgba(255,255,255,0.03)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.75rem',
                                    }}
                                >
                                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '0.75rem', alignItems: 'end' }}>
                                        <div>
                                            <label style={{ marginBottom: '0.35rem' }}>Label</label>
                                            <input
                                                type="text"
                                                value={sprite.label}
                                                onChange={(event) => setSpriteField(sprite.localId, 'label', event.target.value)}
                                                placeholder={`Expression ${index + 1}`}
                                            />
                                        </div>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: 0 }}>
                                            <input
                                                type="checkbox"
                                                checked={sprite.isDefault}
                                                onChange={(event) => setSpriteField(sprite.localId, 'isDefault', event.target.checked)}
                                            />
                                            Default
                                        </label>
                                    </div>

                                    <ImageAssetField
                                        label="Sprite Image"
                                        value={sprite.imageUrl}
                                        onChange={(value) => setSpriteField(sprite.localId, 'imageUrl', value)}
                                        assets={imageAssets.assets}
                                        uploading={imageAssets.uploading}
                                        uploadFiles={imageAssets.uploadFiles}
                                        manageHref="/admin/assets"
                                        helpText="Upload a portrait or choose from the existing image library."
                                    />

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            Variant {index + 1} of {Math.max(sprites.length, 1)}
                                        </p>
                                        <button
                                            type="button"
                                            className="btn btn-danger"
                                            onClick={() => removeSprite(sprite.localId)}
                                            style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem' }}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                {editingId ? 'Update Character' : 'Add Character'}
                            </button>
                            {editingId && (
                                <button type="button" onClick={resetForm} className="btn btn-secondary" style={{ flex: 1 }}>
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                <div>
                    {loading ? (
                        <div className="animate-pulse" style={{ height: '100px', background: 'var(--glass-border)', borderRadius: '8px' }} />
                    ) : characters.length === 0 ? (
                        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
                            <p style={{ color: 'var(--text-muted)' }}>No characters defined yet.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                            {characters.map((character) => (
                                <div key={character.id} className="glass-panel" style={{ padding: '1.35rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '96px minmax(0, 1fr)', gap: '1rem', alignItems: 'start' }}>
                                        <div style={{
                                            width: '96px',
                                            height: '128px',
                                            borderRadius: '14px',
                                            background: 'var(--glass-border)',
                                            overflow: 'hidden',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}>
                                            {character.defaultSprite ? (
                                                <img src={character.defaultSprite.imageUrl} alt={character.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <span style={{ fontSize: '2rem', color: 'var(--text-muted)' }}>?</span>
                                            )}
                                        </div>
                                        <div>
                                            <h3 style={{ marginBottom: '0.35rem', fontSize: '1.1rem' }}>{character.name}</h3>
                                            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                                                {character.sprites.length} sprite variant{character.sprites.length === 1 ? '' : 's'}
                                            </p>
                                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                                {character.sprites.map((sprite) => (
                                                    <span key={sprite.id} className={`badge ${sprite.isDefault ? 'badge-success' : 'badge-secondary'}`}>
                                                        {sprite.label}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                                        <button onClick={() => handleEdit(character)} className="btn btn-secondary" style={{ padding: '0.35rem 0.7rem', fontSize: '0.82rem', flex: 1 }}>
                                            Edit
                                        </button>
                                        <button
                                            onClick={(event) => handleDelete(character.id, event)}
                                            className="btn btn-danger"
                                            style={{ padding: '0.35rem 0.7rem', fontSize: '0.82rem', flex: 1 }}
                                        >
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
