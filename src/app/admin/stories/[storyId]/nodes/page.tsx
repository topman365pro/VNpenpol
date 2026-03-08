'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import BackgroundSelectField from '@/components/admin/BackgroundSelectField';
import MusicTrackSelectField from '@/components/admin/MusicTrackSelectField';
import NodeAudioField from '@/components/admin/NodeAudioField';
import { useAssetLibrary } from '@/components/admin/use-asset-library';
import { deriveAssetLabel } from '@/lib/asset-utils';

interface CharacterSprite {
    id: string;
    label: string;
    imageUrl: string;
    isDefault: boolean;
    sortOrder: number;
}

interface Character {
    id: string;
    name: string;
    sprites: CharacterSprite[];
    defaultSprite: CharacterSprite | null;
}

interface Background {
    id: string;
    name: string;
    imageUrl: string;
}

interface MusicTrack {
    id: string;
    name: string;
    audioUrl: string;
}

interface Choice {
    id: string;
    nodeId: string;
    targetNodeId: string | null;
    text: string;
    scoreImpact: number;
}

interface NodeRecord {
    id: string;
    storyId: string;
    characterId: string | null;
    characterSpriteId: string | null;
    backgroundId: string | null;
    musicTrackId: string | null;
    editorDepth: number;
    editorOrder: number;
    text: string;
    audioUrl: string | null;
    isStartNode: boolean;
    isEndNode: boolean;
    character: Character | null;
    characterSprite: CharacterSprite | null;
    spriteImageUrl: string | null;
    background: Background | null;
    backgroundImageUrl: string | null;
    musicTrack: MusicTrack | null;
    musicTrackAudioUrl: string | null;
    choices: Choice[];
}

function getDefaultCreateDepth(nodes: NodeRecord[]) {
    if (nodes.length === 0) {
        return 0;
    }
    return Math.max(...nodes.map((node) => node.editorDepth), 0) + 1;
}

function previewText(text: string, limit = 48) {
    if (text.length <= limit) {
        return text;
    }
    return `${text.slice(0, limit).trimEnd()}...`;
}

export default function NodesEditor() {
    const params = useParams();
    const storyId = params.storyId as string;

    const [nodes, setNodes] = useState<NodeRecord[]>([]);
    const [characters, setCharacters] = useState<Character[]>([]);
    const [backgrounds, setBackgrounds] = useState<Background[]>([]);
    const [musicTracks, setMusicTracks] = useState<MusicTrack[]>([]);
    const [loading, setLoading] = useState(true);
    const [storyTitle, setStoryTitle] = useState('');

    const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
    const [nodeText, setNodeText] = useState('');
    const [nodeCharacterId, setNodeCharacterId] = useState('');
    const [nodeCharacterSpriteId, setNodeCharacterSpriteId] = useState('');
    const [nodeBackgroundId, setNodeBackgroundId] = useState('');
    const [nodeMusicTrackId, setNodeMusicTrackId] = useState('');
    const [nodeAudioUrl, setNodeAudioUrl] = useState('');
    const [nodeEditorDepth, setNodeEditorDepth] = useState(0);
    const [nodeEditorOrder, setNodeEditorOrder] = useState(0);
    const [nodeIsStart, setNodeIsStart] = useState(false);
    const [nodeIsEnd, setNodeIsEnd] = useState(false);

    const [editingChoiceNodeId, setEditingChoiceNodeId] = useState<string | null>(null);
    const [choiceText, setChoiceText] = useState('');
    const [choiceTargetNodeId, setChoiceTargetNodeId] = useState('');
    const [choiceScoreImpact, setChoiceScoreImpact] = useState(0);
    const [editingChoiceId, setEditingChoiceId] = useState<string | null>(null);

    const imageAssets = useAssetLibrary('image');
    const audioAssets = useAssetLibrary('audio');

    const availableSprites = useMemo(
        () => characters.find((character) => character.id === nodeCharacterId)?.sprites ?? [],
        [characters, nodeCharacterId]
    );

    const activeNodeCharacterSpriteId = useMemo(() => {
        if (!nodeCharacterId) {
            return '';
        }
        return availableSprites.some((sprite) => sprite.id === nodeCharacterSpriteId) ? nodeCharacterSpriteId : '';
    }, [availableSprites, nodeCharacterId, nodeCharacterSpriteId]);

    const fetchNodes = useCallback(async () => {
        setLoading(true);
        const [nodesRes, charsRes, storyRes, backgroundsRes, musicTracksRes] = await Promise.all([
            fetch(`/api/nodes?storyId=${storyId}`),
            fetch('/api/characters'),
            fetch('/api/stories'),
            fetch('/api/backgrounds'),
            fetch('/api/music-tracks'),
        ]);

        if (nodesRes.ok) {
            const nextNodes = await nodesRes.json();
            setNodes(nextNodes);
            if (!editingNodeId) {
                setNodeEditorDepth(getDefaultCreateDepth(nextNodes));
                setNodeEditorOrder(0);
            }
        }
        if (charsRes.ok) {
            setCharacters(await charsRes.json());
        }
        if (backgroundsRes.ok) {
            setBackgrounds(await backgroundsRes.json());
        }
        if (musicTracksRes.ok) {
            setMusicTracks(await musicTracksRes.json());
        }
        if (storyRes.ok) {
            const stories = await storyRes.json();
            const story = stories.find((entry: { id: string; title: string }) => entry.id === storyId);
            setStoryTitle(story?.title ?? '');
        }
        setLoading(false);
    }, [editingNodeId, storyId]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchNodes();
        }, 0);
        return () => clearTimeout(timer);
    }, [fetchNodes]);

    function resetNodeForm() {
        setEditingNodeId(null);
        setNodeText('');
        setNodeCharacterId('');
        setNodeCharacterSpriteId('');
        setNodeBackgroundId('');
        setNodeMusicTrackId('');
        setNodeAudioUrl('');
        setNodeEditorDepth(getDefaultCreateDepth(nodes));
        setNodeEditorOrder(0);
        setNodeIsStart(false);
        setNodeIsEnd(false);
    }

    function resetChoiceForm() {
        setEditingChoiceId(null);
        setChoiceText('');
        setChoiceTargetNodeId('');
        setChoiceScoreImpact(0);
    }

    async function handleQuickCreateBackground(files: File[]) {
        const uploaded = await imageAssets.uploadFiles(files.slice(0, 1));
        const firstUpload = uploaded[0];
        if (!firstUpload) {
            return null;
        }

        const response = await fetch('/api/backgrounds', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: deriveAssetLabel(firstUpload.url, 'Background'),
                imageUrl: firstUpload.url,
            }),
        });

        if (!response.ok) {
            return null;
        }

        const background = await response.json();
        setBackgrounds((current) => [background, ...current]);
        return background.id as string;
    }

    async function handleQuickCreateMusicTrack(files: File[]) {
        const uploaded = await audioAssets.uploadFiles(files.slice(0, 1));
        const firstUpload = uploaded[0];
        if (!firstUpload) {
            return null;
        }

        const response = await fetch('/api/music-tracks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: deriveAssetLabel(firstUpload.url, 'Music Track'),
                audioUrl: firstUpload.url,
            }),
        });

        if (!response.ok) {
            return null;
        }

        const musicTrack = await response.json();
        setMusicTracks((current) => [musicTrack, ...current]);
        return musicTrack.id as string;
    }

    async function handleNodeSubmit(event: React.FormEvent) {
        event.preventDefault();
        if (!nodeText.trim()) {
            return;
        }

        const payload = {
            storyId,
            characterId: nodeCharacterId || null,
            characterSpriteId: activeNodeCharacterSpriteId || null,
            backgroundId: nodeBackgroundId || null,
            musicTrackId: nodeMusicTrackId || null,
            editorDepth: nodeEditorDepth,
            editorOrder: nodeEditorOrder,
            text: nodeText,
            audioUrl: nodeAudioUrl || null,
            isStartNode: nodeIsStart,
            isEndNode: nodeIsEnd,
        };

        const response = await fetch(editingNodeId ? `/api/nodes/${editingNodeId}` : '/api/nodes', {
            method: editingNodeId ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (response.ok) {
            resetNodeForm();
            fetchNodes();
        }
    }

    function handleCharacterChange(nextCharacterId: string) {
        setNodeCharacterId(nextCharacterId);
        const nextSprites = characters.find((character) => character.id === nextCharacterId)?.sprites ?? [];
        setNodeCharacterSpriteId((current) => (nextSprites.some((sprite) => sprite.id === current) ? current : ''));
    }

    function handleEditNode(node: NodeRecord) {
        setEditingNodeId(node.id);
        setNodeText(node.text);
        setNodeCharacterId(node.characterId || '');
        setNodeCharacterSpriteId(node.characterSpriteId || '');
        setNodeBackgroundId(node.backgroundId || '');
        setNodeMusicTrackId(node.musicTrackId || '');
        setNodeAudioUrl(node.audioUrl || '');
        setNodeEditorDepth(node.editorDepth);
        setNodeEditorOrder(node.editorOrder);
        setNodeIsStart(node.isStartNode);
        setNodeIsEnd(node.isEndNode);
        window.scrollTo(0, 0);
    }

    async function handleDeleteNode(id: string) {
        if (!confirm('Delete this node and all its choices?')) {
            return;
        }
        const response = await fetch(`/api/nodes/${id}`, { method: 'DELETE' });
        if (response.ok) {
            if (editingNodeId === id) {
                resetNodeForm();
            }
            fetchNodes();
        }
    }

    async function handleChoiceSubmit(event: React.FormEvent) {
        event.preventDefault();
        if (!choiceText.trim() || !editingChoiceNodeId) {
            return;
        }

        const payload = {
            nodeId: editingChoiceNodeId,
            text: choiceText,
            targetNodeId: choiceTargetNodeId || null,
            scoreImpact: Number(choiceScoreImpact),
        };

        const response = await fetch(editingChoiceId ? `/api/choices/${editingChoiceId}` : '/api/choices', {
            method: editingChoiceId ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (response.ok) {
            resetChoiceForm();
            setEditingChoiceNodeId(null);
            fetchNodes();
        }
    }

    async function handleDeleteChoice(choiceId: string) {
        if (!confirm('Delete this choice?')) {
            return;
        }
        const response = await fetch(`/api/choices/${choiceId}`, { method: 'DELETE' });
        if (response.ok) {
            fetchNodes();
        }
    }

    function handleEditChoice(choice: Choice) {
        setEditingChoiceId(choice.id);
        setEditingChoiceNodeId(choice.nodeId);
        setChoiceText(choice.text);
        setChoiceTargetNodeId(choice.targetNodeId || '');
        setChoiceScoreImpact(choice.scoreImpact);
    }

    function getNodeLabel(node: NodeRecord) {
        const charName = node.character?.name || 'Narrator';
        return `[${charName}] ${previewText(node.text, 40)}`;
    }

    function getNodeSpriteLabel(node: NodeRecord) {
        if (!node.character) {
            return null;
        }
        if (!node.characterSprite) {
            return 'No sprite';
        }
        return node.characterSpriteId ? node.characterSprite.label : `${node.characterSprite.label} (default)`;
    }

    if (loading) {
        return (
            <div>
                <div className="animate-pulse" style={{ height: '40px', width: '300px', background: 'var(--glass-border)', borderRadius: '8px', marginBottom: '2rem' }} />
                <div className="animate-pulse" style={{ height: '200px', background: 'var(--glass-border)', borderRadius: '8px' }} />
            </div>
        );
    }

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <Link href="/admin/stories" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                    ← Back to Stories
                </Link>
                <Link href={`/admin/stories/${storyId}/flow`} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                    Open Flow Editor
                </Link>
                <h1 className="text-gradient" style={{ fontSize: '1.8rem' }}>
                    Nodes — {storyTitle}
                </h1>
                <span className="badge badge-secondary">{nodes.length} node{nodes.length !== 1 ? 's' : ''}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) 2fr', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="glass-panel" style={{ padding: '2rem', height: 'fit-content' }}>
                        <h3 style={{ marginBottom: '1.5rem' }}>{editingNodeId ? 'Edit Node' : 'New Node'}</h3>
                        <form onSubmit={handleNodeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label>Dialogue Text *</label>
                                <textarea
                                    value={nodeText}
                                    onChange={(event) => setNodeText(event.target.value)}
                                    rows={4}
                                    required
                                    placeholder="What the character says..."
                                />
                            </div>
                            <div>
                                <label>Character</label>
                                <select value={nodeCharacterId} onChange={(event) => handleCharacterChange(event.target.value)}>
                                    <option value="">Narrator (no character)</option>
                                    {characters.map((character) => (
                                        <option key={character.id} value={character.id}>
                                            {character.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {nodeCharacterId && (
                                <div>
                                    <label>Sprite Expression</label>
                                    <select value={activeNodeCharacterSpriteId} onChange={(event) => setNodeCharacterSpriteId(event.target.value)}>
                                        <option value="">Character default</option>
                                        {availableSprites.map((sprite) => (
                                            <option key={sprite.id} value={sprite.id}>
                                                {sprite.label}{sprite.isDefault ? ' (Default)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <BackgroundSelectField
                                backgrounds={backgrounds}
                                value={nodeBackgroundId}
                                onChange={setNodeBackgroundId}
                                onQuickCreate={handleQuickCreateBackground}
                            />

                            <MusicTrackSelectField
                                label="Change Background Music"
                                noneLabel="No change"
                                musicTracks={musicTracks}
                                value={nodeMusicTrackId}
                                onChange={setNodeMusicTrackId}
                                onQuickCreate={handleQuickCreateMusicTrack}
                            />

                            <NodeAudioField
                                value={nodeAudioUrl}
                                onChange={setNodeAudioUrl}
                                assets={audioAssets.assets}
                                uploading={audioAssets.uploading}
                                uploadFiles={audioAssets.uploadFiles}
                            />

                            <div style={{ display: 'flex', gap: '1.5rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={nodeIsStart} onChange={(event) => setNodeIsStart(event.target.checked)} />
                                    Start Node
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={nodeIsEnd} onChange={(event) => setNodeIsEnd(event.target.checked)} />
                                    End Node
                                </label>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                    {editingNodeId ? 'Update Node' : 'Create Node'}
                                </button>
                                {editingNodeId && (
                                    <button type="button" onClick={resetNodeForm} className="btn btn-secondary">Cancel</button>
                                )}
                            </div>
                        </form>
                    </div>

                    {editingChoiceNodeId && (
                        <div className="glass-panel animate-fadeIn" style={{ padding: '2rem', border: '1px solid var(--secondary)', height: 'fit-content' }}>
                            <h3 style={{ marginBottom: '1.5rem', color: 'var(--secondary-light)' }}>
                                {editingChoiceId ? 'Edit Choice' : 'New Choice'}
                            </h3>
                            <form onSubmit={handleChoiceSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label>Choice Text *</label>
                                    <input
                                        type="text"
                                        value={choiceText}
                                        onChange={(event) => setChoiceText(event.target.value)}
                                        required
                                        placeholder="Agree with the senator..."
                                    />
                                </div>
                                <div>
                                    <label>Target Node</label>
                                    <select value={choiceTargetNodeId} onChange={(event) => setChoiceTargetNodeId(event.target.value)}>
                                        <option value="">None (dead end)</option>
                                        {nodes.filter((node) => node.id !== editingChoiceNodeId).map((node) => (
                                            <option key={node.id} value={node.id}>
                                                {getNodeLabel(node)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label>Score Impact</label>
                                    <input
                                        type="number"
                                        value={choiceScoreImpact}
                                        onChange={(event) => setChoiceScoreImpact(Number(event.target.value))}
                                        placeholder="0"
                                    />
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                                        Positive = good, Negative = bad
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                        {editingChoiceId ? 'Update' : 'Add Choice'}
                                    </button>
                                    <button type="button" onClick={() => { resetChoiceForm(); setEditingChoiceNodeId(null); }} className="btn btn-secondary">
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {nodes.length === 0 ? (
                        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                            <p style={{ fontSize: '2rem', marginBottom: '1rem' }}>📝</p>
                            <p style={{ color: 'var(--text-muted)' }}>No nodes yet. Create your first dialogue node.</p>
                        </div>
                    ) : (
                        nodes.map((node) => (
                            <div key={node.id} className="glass-panel" style={{ padding: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.75rem' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                        {node.isStartNode && <span className="badge badge-success">Start</span>}
                                        {node.isEndNode && <span className="badge badge-danger">End</span>}
                                        {node.character && <span className="badge badge-accent">{node.character.name}</span>}
                                        {!node.character && <span className="badge badge-secondary">Narrator</span>}
                                        {getNodeSpriteLabel(node) && <span className="badge badge-primary">{getNodeSpriteLabel(node)}</span>}
                                        {node.background && <span className="badge badge-secondary">{node.background.name}</span>}
                                        {node.musicTrack && <span className="badge badge-accent">BGM: {node.musicTrack.name}</span>}
                                        {node.audioUrl && <span className="badge badge-secondary">Audio</span>}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                                        <button onClick={() => handleEditNode(node)} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>Edit</button>
                                        <button onClick={() => handleDeleteNode(node.id)} className="btn btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>Delete</button>
                                    </div>
                                </div>

                                <p style={{ marginBottom: '1rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{node.text}</p>

                                {(node.backgroundImageUrl || node.musicTrackAudioUrl || node.audioUrl || node.spriteImageUrl) && (
                                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                        {node.spriteImageUrl && (
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>🙂 {node.spriteImageUrl}</span>
                                        )}
                                        {node.backgroundImageUrl && (
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>🖼️ {node.background?.name ?? node.backgroundImageUrl}</span>
                                        )}
                                        {node.musicTrackAudioUrl && (
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>🎵 {node.musicTrack?.name ?? node.musicTrackAudioUrl}</span>
                                        )}
                                        {node.audioUrl && (
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>🔊 {node.audioUrl}</span>
                                        )}
                                    </div>
                                )}

                                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '0.75rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                                            Choices ({node.choices.length})
                                        </span>
                                        {!node.isEndNode && (
                                            <button
                                                onClick={() => { resetChoiceForm(); setEditingChoiceNodeId(node.id); }}
                                                className="btn btn-secondary"
                                                style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                                            >
                                                + Add Choice
                                            </button>
                                        )}
                                    </div>
                                    {node.choices.length > 0 && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                            {node.choices.map((choice) => {
                                                const targetNode = nodes.find((entry) => entry.id === choice.targetNodeId);
                                                return (
                                                    <div key={choice.id} style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        padding: '0.5rem 0.75rem',
                                                        background: 'rgba(0,0,0,0.2)',
                                                        borderRadius: 'var(--radius-sm)',
                                                        border: '1px solid var(--glass-border)',
                                                        fontSize: '0.9rem',
                                                    }}>
                                                        <div>
                                                            <span>{choice.text}</span>
                                                            {choice.scoreImpact !== 0 && (
                                                                <span style={{ marginLeft: '0.5rem', color: choice.scoreImpact > 0 ? 'var(--success-light)' : 'var(--danger-light)', fontSize: '0.8rem' }}>
                                                                    {choice.scoreImpact > 0 ? '+' : ''}{choice.scoreImpact}
                                                                </span>
                                                            )}
                                                            {targetNode && (
                                                                <span style={{ marginLeft: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                                    → {getNodeLabel(targetNode)}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
                                                            <button onClick={() => handleEditChoice(choice)} className="btn btn-secondary" style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }}>Edit</button>
                                                            <button onClick={() => handleDeleteChoice(choice.id)} className="btn btn-danger" style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }}>Del</button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                    {node.choices.length === 0 && !node.isEndNode && (
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                            No choices yet. Add choices to link to other nodes.
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
