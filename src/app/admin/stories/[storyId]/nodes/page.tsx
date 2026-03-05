'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Character {
    id: string;
    name: string;
    spriteImageUrl: string | null;
}

interface Choice {
    id: string;
    nodeId: string;
    targetNodeId: string | null;
    text: string;
    scoreImpact: number;
}

interface Node {
    id: string;
    storyId: string;
    characterId: string | null;
    text: string;
    backgroundImageUrl: string | null;
    audioUrl: string | null;
    isStartNode: boolean;
    isEndNode: boolean;
    character: Character | null;
    choices: Choice[];
}

export default function NodesEditor() {
    const params = useParams();
    const storyId = params.storyId as string;

    const [nodes, setNodes] = useState<Node[]>([]);
    const [characters, setCharacters] = useState<Character[]>([]);
    const [loading, setLoading] = useState(true);
    const [storyTitle, setStoryTitle] = useState('');

    // Node form
    const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
    const [nodeText, setNodeText] = useState('');
    const [nodeCharacterId, setNodeCharacterId] = useState('');
    const [nodeBgUrl, setNodeBgUrl] = useState('');
    const [nodeAudioUrl, setNodeAudioUrl] = useState('');
    const [nodeIsStart, setNodeIsStart] = useState(false);
    const [nodeIsEnd, setNodeIsEnd] = useState(false);

    // Choice form
    const [editingChoiceNodeId, setEditingChoiceNodeId] = useState<string | null>(null);
    const [choiceText, setChoiceText] = useState('');
    const [choiceTargetNodeId, setChoiceTargetNodeId] = useState('');
    const [choiceScoreImpact, setChoiceScoreImpact] = useState(0);
    const [editingChoiceId, setEditingChoiceId] = useState<string | null>(null);

    const fetchNodes = useCallback(async () => {
        setLoading(true);
        const [nodesRes, charsRes, storyRes] = await Promise.all([
            fetch(`/api/nodes?storyId=${storyId}`),
            fetch('/api/characters'),
            fetch(`/api/stories`),
        ]);
        if (nodesRes.ok) setNodes(await nodesRes.json());
        if (charsRes.ok) setCharacters(await charsRes.json());
        if (storyRes.ok) {
            const stories = await storyRes.json();
            const story = stories.find((s: { id: string; title: string }) => s.id === storyId);
            if (story) setStoryTitle(story.title);
        }
        setLoading(false);
    }, [storyId]);

    useEffect(() => {
        const timer = setTimeout(() => { fetchNodes(); }, 0);
        return () => clearTimeout(timer);
    }, [fetchNodes]);

    const resetNodeForm = () => {
        setEditingNodeId(null);
        setNodeText('');
        setNodeCharacterId('');
        setNodeBgUrl('');
        setNodeAudioUrl('');
        setNodeIsStart(false);
        setNodeIsEnd(false);
    };

    const handleNodeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nodeText) return;

        const payload = {
            storyId,
            characterId: nodeCharacterId || null,
            text: nodeText,
            backgroundImageUrl: nodeBgUrl || null,
            audioUrl: nodeAudioUrl || null,
            isStartNode: nodeIsStart,
            isEndNode: nodeIsEnd,
        };

        if (editingNodeId) {
            const res = await fetch(`/api/nodes/${editingNodeId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (res.ok) { resetNodeForm(); fetchNodes(); }
        } else {
            const res = await fetch('/api/nodes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (res.ok) { resetNodeForm(); fetchNodes(); }
        }
    };

    const handleEditNode = (node: Node) => {
        setEditingNodeId(node.id);
        setNodeText(node.text);
        setNodeCharacterId(node.characterId || '');
        setNodeBgUrl(node.backgroundImageUrl || '');
        setNodeAudioUrl(node.audioUrl || '');
        setNodeIsStart(node.isStartNode);
        setNodeIsEnd(node.isEndNode);
        window.scrollTo(0, 0);
    };

    const handleDeleteNode = async (id: string) => {
        if (!confirm('Delete this node and all its choices?')) return;
        const res = await fetch(`/api/nodes/${id}`, { method: 'DELETE' });
        if (res.ok) { if (editingNodeId === id) resetNodeForm(); fetchNodes(); }
    };

    // Choice handlers
    const resetChoiceForm = () => {
        setEditingChoiceId(null);
        setChoiceText('');
        setChoiceTargetNodeId('');
        setChoiceScoreImpact(0);
    };

    const handleChoiceSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!choiceText || !editingChoiceNodeId) return;

        const payload = {
            nodeId: editingChoiceNodeId,
            text: choiceText,
            targetNodeId: choiceTargetNodeId || null,
            scoreImpact: Number(choiceScoreImpact),
        };

        if (editingChoiceId) {
            const res = await fetch(`/api/choices/${editingChoiceId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (res.ok) { resetChoiceForm(); setEditingChoiceNodeId(null); fetchNodes(); }
        } else {
            const res = await fetch('/api/choices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (res.ok) { resetChoiceForm(); setEditingChoiceNodeId(null); fetchNodes(); }
        }
    };

    const handleDeleteChoice = async (choiceId: string) => {
        if (!confirm('Delete this choice?')) return;
        const res = await fetch(`/api/choices/${choiceId}`, { method: 'DELETE' });
        if (res.ok) fetchNodes();
    };

    const handleEditChoice = (choice: Choice) => {
        setEditingChoiceId(choice.id);
        setEditingChoiceNodeId(choice.nodeId);
        setChoiceText(choice.text);
        setChoiceTargetNodeId(choice.targetNodeId || '');
        setChoiceScoreImpact(choice.scoreImpact);
    };

    const getNodeLabel = (node: Node) => {
        const charName = node.character?.name || 'Narrator';
        const textPreview = node.text.length > 40 ? node.text.substring(0, 40) + '...' : node.text;
        return `[${charName}] ${textPreview}`;
    };

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
                <h1 className="text-gradient" style={{ fontSize: '1.8rem' }}>
                    Nodes — {storyTitle}
                </h1>
                <span className="badge badge-secondary">{nodes.length} node{nodes.length !== 1 ? 's' : ''}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) 2fr', gap: '2rem' }}>
                {/* Node Form */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="glass-panel" style={{ padding: '2rem', height: 'fit-content' }}>
                        <h3 style={{ marginBottom: '1.5rem' }}>{editingNodeId ? '✏️ Edit Node' : '➕ New Node'}</h3>
                        <form onSubmit={handleNodeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label>Dialogue Text *</label>
                                <textarea value={nodeText} onChange={e => setNodeText(e.target.value)} rows={4} required
                                    placeholder="What the character says..." />
                            </div>
                            <div>
                                <label>Character</label>
                                <select value={nodeCharacterId} onChange={e => setNodeCharacterId(e.target.value)}>
                                    <option value="">Narrator (no character)</option>
                                    {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label>Background Image URL</label>
                                <input type="text" value={nodeBgUrl} onChange={e => setNodeBgUrl(e.target.value)} placeholder="/uploads/bg-parliament.jpg" />
                            </div>
                            <div>
                                <label>Audio URL</label>
                                <input type="text" value={nodeAudioUrl} onChange={e => setNodeAudioUrl(e.target.value)} placeholder="/uploads/speech.mp3" />
                            </div>
                            <div style={{ display: 'flex', gap: '1.5rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={nodeIsStart} onChange={e => setNodeIsStart(e.target.checked)} />
                                    Start Node
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={nodeIsEnd} onChange={e => setNodeIsEnd(e.target.checked)} />
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

                    {/* Choice Form (shown when adding/editing a choice) */}
                    {editingChoiceNodeId && (
                        <div className="glass-panel animate-fadeIn" style={{ padding: '2rem', border: '1px solid var(--secondary)', height: 'fit-content' }}>
                            <h3 style={{ marginBottom: '1.5rem', color: 'var(--secondary-light)' }}>
                                {editingChoiceId ? '✏️ Edit Choice' : '➕ New Choice'}
                            </h3>
                            <form onSubmit={handleChoiceSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label>Choice Text *</label>
                                    <input type="text" value={choiceText} onChange={e => setChoiceText(e.target.value)} required
                                        placeholder="Agree with the senator..." />
                                </div>
                                <div>
                                    <label>Target Node</label>
                                    <select value={choiceTargetNodeId} onChange={e => setChoiceTargetNodeId(e.target.value)}>
                                        <option value="">None (dead end)</option>
                                        {nodes.filter(n => n.id !== editingChoiceNodeId).map(n => (
                                            <option key={n.id} value={n.id}>{getNodeLabel(n)}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label>Score Impact</label>
                                    <input type="number" value={choiceScoreImpact} onChange={e => setChoiceScoreImpact(Number(e.target.value))}
                                        placeholder="0" />
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

                {/* Nodes List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {nodes.length === 0 ? (
                        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                            <p style={{ fontSize: '2rem', marginBottom: '1rem' }}>📝</p>
                            <p style={{ color: 'var(--text-muted)' }}>No nodes yet. Create your first dialogue node!</p>
                        </div>
                    ) : (
                        nodes.map(node => (
                            <div key={node.id} className="glass-panel" style={{ padding: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.75rem' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                        {node.isStartNode && <span className="badge badge-success">Start</span>}
                                        {node.isEndNode && <span className="badge badge-danger">End</span>}
                                        {node.character && <span className="badge badge-accent">{node.character.name}</span>}
                                        {!node.character && <span className="badge badge-secondary">Narrator</span>}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                                        <button onClick={() => handleEditNode(node)} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>Edit</button>
                                        <button onClick={() => handleDeleteNode(node.id)} className="btn btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>Delete</button>
                                    </div>
                                </div>

                                <p style={{ marginBottom: '1rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{node.text}</p>

                                {(node.backgroundImageUrl || node.audioUrl) && (
                                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                        {node.backgroundImageUrl && (
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>🖼️ {node.backgroundImageUrl}</span>
                                        )}
                                        {node.audioUrl && (
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>🔊 {node.audioUrl}</span>
                                        )}
                                    </div>
                                )}

                                {/* Choices */}
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
                                            {node.choices.map(choice => {
                                                const targetNode = nodes.find(n => n.id === choice.targetNodeId);
                                                return (
                                                    <div key={choice.id} style={{
                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                        padding: '0.5rem 0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)',
                                                        border: '1px solid var(--glass-border)', fontSize: '0.9rem'
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
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No choices yet — add choices to link to other nodes</p>
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
