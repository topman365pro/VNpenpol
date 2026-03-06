'use client';

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { useEffect, useState } from 'react';
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

interface NodeRecord {
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

interface Asset {
    name: string;
    url: string;
    size: number;
    modified: string;
}

interface PositionedNode extends NodeRecord {
    depth: number;
    order: number;
    x: number;
    y: number;
}

const cardWidth = 250;
const cardHeight = 174;
const horizontalGap = 120;
const verticalGap = 72;
const canvasPadding = 56;

function isImageAsset(name: string) {
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(name);
}

function isAudioAsset(name: string) {
    return /\.(mp3|wav|ogg|m4a)$/i.test(name);
}

function previewText(text: string, limit = 105) {
    if (text.length <= limit) {
        return text;
    }
    return `${text.slice(0, limit).trimEnd()}...`;
}

function buildLayout(nodes: NodeRecord[]) {
    if (nodes.length === 0) {
        return {
            positionedNodes: [] as PositionedNode[],
            width: 920,
            height: 520,
        };
    }

    const byId = new Map(nodes.map((node) => [node.id, node]));
    const adjacency = new Map<string, string[]>();

    for (const node of nodes) {
        adjacency.set(
            node.id,
            node.choices
                .map((choice) => choice.targetNodeId)
                .filter((targetNodeId): targetNodeId is string => targetNodeId !== null && byId.has(targetNodeId))
        );
    }

    const depthById = new Map<string, number>();
    const startNodes = nodes.filter((node) => node.isStartNode);
    const queue = (startNodes.length > 0 ? startNodes : [nodes[0]]).map((node) => node.id);

    for (const startId of queue) {
        depthById.set(startId, 0);
    }

    while (queue.length > 0) {
        const nodeId = queue.shift();
        if (!nodeId) {
            continue;
        }

        const baseDepth = depthById.get(nodeId) ?? 0;
        for (const targetNodeId of adjacency.get(nodeId) ?? []) {
            if (!depthById.has(targetNodeId)) {
                depthById.set(targetNodeId, baseDepth + 1);
                queue.push(targetNodeId);
            }
        }
    }

    let maxDepth = Math.max(...depthById.values(), 0);
    for (const node of nodes) {
        if (!depthById.has(node.id)) {
            maxDepth += 1;
            depthById.set(node.id, maxDepth);
        }
    }

    const groups = new Map<number, NodeRecord[]>();
    for (const node of nodes) {
        const depth = depthById.get(node.id) ?? 0;
        const group = groups.get(depth) ?? [];
        group.push(node);
        groups.set(depth, group);
    }

    const positionedNodes: PositionedNode[] = [];
    const sortedDepths = [...groups.keys()].sort((left, right) => left - right);

    for (const depth of sortedDepths) {
        const group = groups.get(depth) ?? [];
        group.sort((left, right) => {
            if (left.isStartNode !== right.isStartNode) {
                return left.isStartNode ? -1 : 1;
            }
            if (left.isEndNode !== right.isEndNode) {
                return left.isEndNode ? 1 : -1;
            }
            return left.text.localeCompare(right.text);
        });

        group.forEach((node, order) => {
            positionedNodes.push({
                ...node,
                depth,
                order,
                x: canvasPadding + depth * (cardWidth + horizontalGap),
                y: canvasPadding + order * (cardHeight + verticalGap),
            });
        });
    }

    const maxColumn = Math.max(...positionedNodes.map((node) => node.depth), 0);
    const maxRow = Math.max(...positionedNodes.map((node) => node.order), 0);

    return {
        positionedNodes,
        width: canvasPadding * 2 + (maxColumn + 1) * cardWidth + maxColumn * horizontalGap,
        height: canvasPadding * 2 + (maxRow + 1) * cardHeight + maxRow * verticalGap,
    };
}

export default function StoryFlowEditorPage() {
    const params = useParams();
    const storyId = params.storyId as string;

    const [nodes, setNodes] = useState<NodeRecord[]>([]);
    const [characters, setCharacters] = useState<Character[]>([]);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [storyTitle, setStoryTitle] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [assetMessage, setAssetMessage] = useState<string | null>(null);

    const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
    const [nodeText, setNodeText] = useState('');
    const [nodeCharacterId, setNodeCharacterId] = useState('');
    const [nodeBgUrl, setNodeBgUrl] = useState('');
    const [nodeAudioUrl, setNodeAudioUrl] = useState('');
    const [nodeIsStart, setNodeIsStart] = useState(false);
    const [nodeIsEnd, setNodeIsEnd] = useState(false);

    const [editingChoiceId, setEditingChoiceId] = useState<string | null>(null);
    const [choiceText, setChoiceText] = useState('');
    const [choiceTargetNodeId, setChoiceTargetNodeId] = useState('');
    const [choiceScoreImpact, setChoiceScoreImpact] = useState(0);

    const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? null;
    const layout = buildLayout(nodes);
    const positions = new Map(layout.positionedNodes.map((node) => [node.id, node]));
    const totalChoices = nodes.reduce((sum, node) => sum + node.choices.length, 0);

    function resetChoiceEditor() {
        setEditingChoiceId(null);
        setChoiceText('');
        setChoiceTargetNodeId('');
        setChoiceScoreImpact(0);
    }

    function resetNodeEditor() {
        setEditingNodeId(null);
        setSelectedNodeId(null);
        setNodeText('');
        setNodeCharacterId('');
        setNodeBgUrl('');
        setNodeAudioUrl('');
        setNodeIsStart(false);
        setNodeIsEnd(false);
        resetChoiceEditor();
    }

    function populateNodeEditor(node: NodeRecord) {
        setEditingNodeId(node.id);
        setSelectedNodeId(node.id);
        setNodeText(node.text);
        setNodeCharacterId(node.characterId ?? '');
        setNodeBgUrl(node.backgroundImageUrl ?? '');
        setNodeAudioUrl(node.audioUrl ?? '');
        setNodeIsStart(node.isStartNode);
        setNodeIsEnd(node.isEndNode);
        resetChoiceEditor();
    }

    async function fetchEditorData(preferredNodeId?: string | null) {
        setLoading(true);
        try {
            const [nodesRes, charsRes, storiesRes, assetsRes] = await Promise.all([
                fetch(`/api/nodes?storyId=${storyId}`),
                fetch('/api/characters'),
                fetch('/api/stories'),
                fetch('/api/assets'),
            ]);

            const nextNodes: NodeRecord[] = nodesRes.ok ? await nodesRes.json() : [];
            const nextCharacters: Character[] = charsRes.ok ? await charsRes.json() : [];
            const nextStories: { id: string; title: string }[] = storiesRes.ok ? await storiesRes.json() : [];
            const nextAssets: Asset[] = assetsRes.ok ? await assetsRes.json() : [];

            setNodes(nextNodes);
            setCharacters(nextCharacters);
            setAssets(nextAssets);

            const story = nextStories.find((entry) => entry.id === storyId);
            setStoryTitle(story?.title ?? 'Story Flow');

            const nextSelectedId = preferredNodeId ?? selectedNodeId;
            const preferredNode = nextSelectedId ? nextNodes.find((node) => node.id === nextSelectedId) : null;
            if (preferredNode) {
                populateNodeEditor(preferredNode);
            } else if (nextNodes.length > 0) {
                const startNode = nextNodes.find((node) => node.isStartNode) ?? nextNodes[0];
                populateNodeEditor(startNode);
            } else {
                resetNodeEditor();
            }
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchEditorData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [storyId]);

    async function handleNodeSubmit(event: React.FormEvent) {
        event.preventDefault();
        if (!nodeText.trim()) {
            return;
        }

        setSaving(true);
        const payload = {
            storyId,
            characterId: nodeCharacterId || null,
            text: nodeText,
            backgroundImageUrl: nodeBgUrl || null,
            audioUrl: nodeAudioUrl || null,
            isStartNode: nodeIsStart,
            isEndNode: nodeIsEnd,
        };

        const response = await fetch(editingNodeId ? `/api/nodes/${editingNodeId}` : '/api/nodes', {
            method: editingNodeId ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        setSaving(false);
        if (!response.ok) {
            return;
        }

        const node = await response.json();
        await fetchEditorData(node.id);
    }

    async function handleDeleteNode() {
        if (!editingNodeId) {
            return;
        }
        if (!confirm('Delete this node and all of its outgoing choices?')) {
            return;
        }

        await fetch(`/api/nodes/${editingNodeId}`, { method: 'DELETE' });
        await fetchEditorData(null);
    }

    async function handleChoiceSubmit(event: React.FormEvent) {
        event.preventDefault();
        if (!selectedNodeId || !choiceText.trim()) {
            return;
        }

        const payload = {
            nodeId: selectedNodeId,
            text: choiceText,
            targetNodeId: choiceTargetNodeId || null,
            scoreImpact: Number(choiceScoreImpact),
        };

        const response = await fetch(editingChoiceId ? `/api/choices/${editingChoiceId}` : '/api/choices', {
            method: editingChoiceId ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            return;
        }

        resetChoiceEditor();
        await fetchEditorData(selectedNodeId);
    }

    async function handleDeleteChoice(choiceId: string) {
        if (!confirm('Delete this branch?')) {
            return;
        }
        await fetch(`/api/choices/${choiceId}`, { method: 'DELETE' });
        await fetchEditorData(selectedNodeId);
    }

    function editChoice(choice: Choice) {
        setEditingChoiceId(choice.id);
        setChoiceText(choice.text);
        setChoiceTargetNodeId(choice.targetNodeId ?? '');
        setChoiceScoreImpact(choice.scoreImpact);
    }

    async function handleAssetUpload(event: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(event.target.files ?? []);
        if (files.length === 0) {
            return;
        }

        setUploading(true);
        setAssetMessage(null);

        const uploaded: { url: string; name: string }[] = [];
        for (const file of files) {
            const formData = new FormData();
            formData.append('file', file);
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                uploaded.push(await response.json());
            }
        }

        setUploading(false);
        event.target.value = '';
        await fetchEditorData(selectedNodeId);

        if (uploaded.length > 0) {
            const firstUpload = uploaded[0];
            if (isImageAsset(firstUpload.name)) {
                setNodeBgUrl(firstUpload.url);
                setAssetMessage(`Uploaded ${uploaded.length} file(s). Background field updated.`);
            } else if (isAudioAsset(firstUpload.name)) {
                setNodeAudioUrl(firstUpload.url);
                setAssetMessage(`Uploaded ${uploaded.length} file(s). Audio field updated.`);
            } else {
                setAssetMessage(`Uploaded ${uploaded.length} file(s).`);
            }
        }
    }

    function assignAsset(url: string, type: 'background' | 'audio') {
        if (type === 'background') {
            setNodeBgUrl(url);
        } else {
            setNodeAudioUrl(url);
        }
    }

    return (
        <div style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <Link href="/admin/stories" className="btn btn-secondary" style={{ padding: '0.45rem 0.8rem', fontSize: '0.85rem' }}>
                    Back to Stories
                </Link>
                <Link href={`/admin/stories/${storyId}/nodes`} className="btn btn-secondary" style={{ padding: '0.45rem 0.8rem', fontSize: '0.85rem' }}>
                    Open Classic Editor
                </Link>
                <div>
                    <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '0.2rem' }}>
                        Flow Editor
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                        {storyTitle || 'Loading story'}: manage branches visually, then edit dialogue and media in the sidebar.
                    </p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.9rem', marginBottom: '1.5rem' }}>
                <div className="glass-panel" style={{ padding: '1rem 1.2rem' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Nodes</p>
                    <p style={{ fontSize: '1.9rem', fontWeight: 800 }}>{nodes.length}</p>
                </div>
                <div className="glass-panel" style={{ padding: '1rem 1.2rem' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Branches</p>
                    <p style={{ fontSize: '1.9rem', fontWeight: 800 }}>{totalChoices}</p>
                </div>
                <div className="glass-panel" style={{ padding: '1rem 1.2rem' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Endings</p>
                    <p style={{ fontSize: '1.9rem', fontWeight: 800 }}>{nodes.filter((node) => node.isEndNode).length}</p>
                </div>
                <div className="glass-panel" style={{ padding: '1rem 1.2rem' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Assets</p>
                    <p style={{ fontSize: '1.9rem', fontWeight: 800 }}>{assets.length}</p>
                </div>
            </div>

            <div className="flow-editor-shell">
                <section className="flow-editor-canvas glass-panel">
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Story map</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                Click any card to edit it. Columns represent progression depth from the start node.
                            </p>
                        </div>
                        <button type="button" className="btn btn-primary" onClick={resetNodeEditor}>
                            New Node
                        </button>
                    </div>

                    {loading ? (
                        <div className="animate-pulse" style={{ minHeight: '520px', borderRadius: '20px', background: 'rgba(255,255,255,0.04)' }} />
                    ) : nodes.length === 0 ? (
                        <div style={{ minHeight: '520px', display: 'grid', placeItems: 'center', textAlign: 'center' }}>
                            <div>
                                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>No nodes yet</h3>
                                <p style={{ color: 'var(--text-muted)', maxWidth: '420px' }}>
                                    Start the story by creating the opening node, then add branches from the sidebar.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flow-canvas-grid">
                            <div style={{ position: 'relative', minWidth: `${layout.width}px`, minHeight: `${layout.height}px` }}>
                                <svg
                                    width={layout.width}
                                    height={layout.height}
                                    style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}
                                >
                                    {layout.positionedNodes.flatMap((node) => (
                                        node.choices.map((choice) => {
                                            if (!choice.targetNodeId) {
                                                return null;
                                            }
                                            const target = positions.get(choice.targetNodeId);
                                            if (!target) {
                                                return null;
                                            }

                                            const startX = node.x + cardWidth;
                                            const startY = node.y + cardHeight / 2;
                                            const endX = target.x;
                                            const endY = target.y + cardHeight / 2;
                                            const curve = Math.max(70, (endX - startX) / 2);
                                            const edgeColor = choice.scoreImpact > 0 ? 'rgba(74, 222, 128, 0.7)' : choice.scoreImpact < 0 ? 'rgba(248, 113, 113, 0.7)' : 'rgba(103, 232, 249, 0.58)';

                                            return (
                                                <g key={choice.id}>
                                                    <path
                                                        d={`M ${startX} ${startY} C ${startX + curve} ${startY}, ${endX - curve} ${endY}, ${endX} ${endY}`}
                                                        fill="none"
                                                        stroke={edgeColor}
                                                        strokeWidth="3"
                                                        strokeLinecap="round"
                                                        opacity="0.9"
                                                    />
                                                    <circle cx={endX} cy={endY} r="4.5" fill={edgeColor} />
                                                </g>
                                            );
                                        })
                                    ))}
                                </svg>

                                {layout.positionedNodes.map((node) => (
                                    <button
                                        key={node.id}
                                        type="button"
                                        className={`flow-node-card${selectedNodeId === node.id ? ' is-selected' : ''}`}
                                        onClick={() => populateNodeEditor(node)}
                                        style={{
                                            left: `${node.x}px`,
                                            top: `${node.y}px`,
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center', marginBottom: '0.6rem' }}>
                                            <span className={`badge ${node.isEndNode ? 'badge-danger' : node.isStartNode ? 'badge-success' : 'badge-secondary'}`}>
                                                {node.isStartNode ? 'Start' : node.isEndNode ? 'End' : `Depth ${node.depth + 1}`}
                                            </span>
                                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                                {node.choices.length} choice{node.choices.length === 1 ? '' : 's'}
                                            </span>
                                        </div>
                                        <h3 style={{ fontSize: '1rem', marginBottom: '0.4rem' }}>
                                            {node.character?.name ?? 'Narrator'}
                                        </h3>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                                            {previewText(node.text)}
                                        </p>
                                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.8rem' }}>
                                            {node.backgroundImageUrl && <span className="badge badge-accent">BG</span>}
                                            {node.audioUrl && <span className="badge badge-primary">Audio</span>}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </section>

                <aside className="flow-editor-sidebar">
                    <div className="glass-panel" style={{ padding: '1.35rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem' }}>
                            <div>
                                <h2 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>
                                    {editingNodeId ? 'Node details' : 'Create node'}
                                </h2>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                                    {editingNodeId ? 'Editing the selected card from the flow map.' : 'No card selected yet. Create a new branch.'}
                                </p>
                            </div>
                            {editingNodeId && (
                                <button type="button" className="btn btn-secondary" onClick={resetNodeEditor} style={{ padding: '0.45rem 0.7rem', fontSize: '0.8rem' }}>
                                    New
                                </button>
                            )}
                        </div>

                        <form onSubmit={handleNodeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                            <div>
                                <label>Dialogue Text</label>
                                <textarea
                                    rows={5}
                                    required
                                    value={nodeText}
                                    onChange={(event) => setNodeText(event.target.value)}
                                    placeholder="Write the scene text here..."
                                />
                            </div>
                            <div>
                                <label>Character</label>
                                <select value={nodeCharacterId} onChange={(event) => setNodeCharacterId(event.target.value)}>
                                    <option value="">Narrator</option>
                                    {characters.map((character) => (
                                        <option key={character.id} value={character.id}>
                                            {character.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label>Background Asset</label>
                                <input
                                    type="text"
                                    value={nodeBgUrl}
                                    onChange={(event) => setNodeBgUrl(event.target.value)}
                                    placeholder="/uploads/scene.png"
                                />
                            </div>
                            <div>
                                <label>Audio Asset</label>
                                <input
                                    type="text"
                                    value={nodeAudioUrl}
                                    onChange={(event) => setNodeAudioUrl(event.target.value)}
                                    placeholder="/uploads/scene.mp3"
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: 0 }}>
                                    <input type="checkbox" checked={nodeIsStart} onChange={(event) => setNodeIsStart(event.target.checked)} />
                                    Start node
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: 0 }}>
                                    <input type="checkbox" checked={nodeIsEnd} onChange={(event) => setNodeIsEnd(event.target.checked)} />
                                    End node
                                </label>
                            </div>
                            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                                <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 1 }}>
                                    {saving ? 'Saving...' : editingNodeId ? 'Save Node' : 'Create Node'}
                                </button>
                                {editingNodeId && (
                                    <button type="button" className="btn btn-danger" onClick={handleDeleteNode}>
                                        Delete
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    <div className="glass-panel" style={{ padding: '1.35rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center', marginBottom: '0.9rem' }}>
                            <div>
                                <h2 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>Branch editor</h2>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                                    Create transitions from the currently selected node.
                                </p>
                            </div>
                        </div>

                        {!selectedNode ? (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                                Select a node in the graph to manage its outgoing choices.
                            </p>
                        ) : (
                            <>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1rem' }}>
                                    {selectedNode.choices.map((choice) => {
                                        const target = nodes.find((node) => node.id === choice.targetNodeId);
                                        return (
                                            <div key={choice.id} style={{ padding: '0.8rem', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                                <p style={{ fontSize: '0.92rem', marginBottom: '0.3rem', color: 'var(--text-primary)' }}>{choice.text}</p>
                                                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
                                                    Leads to {target ? `"${previewText(target.text, 44)}"` : 'a dead end'} · Score {choice.scoreImpact >= 0 ? '+' : ''}{choice.scoreImpact}
                                                </p>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button type="button" className="btn btn-secondary" onClick={() => editChoice(choice)} style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem' }}>
                                                        Edit
                                                    </button>
                                                    <button type="button" className="btn btn-danger" onClick={() => handleDeleteChoice(choice.id)} style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem' }}>
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {selectedNode.choices.length === 0 && !selectedNode.isEndNode && (
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                                            No branches yet. Add the first outgoing choice below.
                                        </p>
                                    )}
                                    {selectedNode.isEndNode && (
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                                            This node is marked as an ending, so no outgoing branches are needed.
                                        </p>
                                    )}
                                </div>

                                {!selectedNode.isEndNode && (
                                    <form onSubmit={handleChoiceSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                        <div>
                                            <label>Choice Text</label>
                                            <input
                                                type="text"
                                                required
                                                value={choiceText}
                                                onChange={(event) => setChoiceText(event.target.value)}
                                                placeholder="What can the player choose?"
                                            />
                                        </div>
                                        <div>
                                            <label>Target Node</label>
                                            <select value={choiceTargetNodeId} onChange={(event) => setChoiceTargetNodeId(event.target.value)}>
                                                <option value="">Dead end / finish here</option>
                                                {nodes
                                                    .filter((node) => node.id !== selectedNode.id)
                                                    .map((node) => (
                                                        <option key={node.id} value={node.id}>
                                                            {node.character?.name ?? 'Narrator'}: {previewText(node.text, 42)}
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
                                            />
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.65rem' }}>
                                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                                {editingChoiceId ? 'Save Branch' : 'Add Branch'}
                                            </button>
                                            {editingChoiceId && (
                                                <button type="button" className="btn btn-secondary" onClick={resetChoiceEditor}>
                                                    Cancel
                                                </button>
                                            )}
                                        </div>
                                    </form>
                                )}
                            </>
                        )}
                    </div>

                    <div className="glass-panel" style={{ padding: '1.35rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center', marginBottom: '0.9rem', flexWrap: 'wrap' }}>
                            <div>
                                <h2 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>Asset uploads</h2>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                                    Upload backgrounds or audio, then assign them directly into the current node form.
                                </p>
                            </div>
                            <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
                                {uploading ? 'Uploading...' : 'Upload Files'}
                                <input type="file" multiple accept="image/*,audio/*" style={{ display: 'none' }} onChange={handleAssetUpload} />
                            </label>
                        </div>

                        {assetMessage && (
                            <p style={{ color: 'var(--secondary-light)', fontSize: '0.86rem', marginBottom: '0.85rem' }}>
                                {assetMessage}
                            </p>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '0.2rem' }}>
                            {assets.map((asset) => (
                                <div key={asset.name} style={{ padding: '0.8rem', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                                        <div style={{
                                            width: '60px',
                                            height: '60px',
                                            flexShrink: 0,
                                            borderRadius: '12px',
                                            background: 'rgba(0,0,0,0.25)',
                                            overflow: 'hidden',
                                            display: 'grid',
                                            placeItems: 'center',
                                        }}>
                                            {isImageAsset(asset.name) ? (
                                                <img src={asset.url} alt={asset.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                                    {isAudioAsset(asset.name) ? 'AUDIO' : 'FILE'}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ minWidth: 0, flex: 1 }}>
                                            <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', wordBreak: 'break-word' }}>{asset.name.replace(/^\d+_/, '')}</p>
                                            <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{asset.url}</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                                        {isImageAsset(asset.name) && (
                                            <button type="button" className="btn btn-secondary" onClick={() => assignAsset(asset.url, 'background')} style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem' }}>
                                                Use as background
                                            </button>
                                        )}
                                        {isAudioAsset(asset.name) && (
                                            <button type="button" className="btn btn-secondary" onClick={() => assignAsset(asset.url, 'audio')} style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem' }}>
                                                Use as audio
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {assets.length === 0 && (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                                    No uploaded assets yet.
                                </p>
                            )}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
