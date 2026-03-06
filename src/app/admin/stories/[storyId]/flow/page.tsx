'use client';

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import BackgroundSelectField from '@/components/admin/BackgroundSelectField';
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
    choices: Choice[];
    createdAt: string;
    updatedAt: string;
}

interface LayoutNode extends NodeRecord {
    isGhost?: boolean;
}

interface PositionedNode extends LayoutNode {
    laneIndex: number;
    x: number;
    y: number;
}

interface DragState {
    nodeId: string;
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startX: number;
    startY: number;
    currentClientX: number;
    currentClientY: number;
}

const cardWidth = 250;
const cardHeight = 194;
const horizontalGap = 120;
const verticalGap = 72;
const canvasPadding = 56;
const dragThreshold = 6;

function previewText(text: string, limit = 105) {
    if (text.length <= limit) {
        return text;
    }
    return `${text.slice(0, limit).trimEnd()}...`;
}

function compareLayoutNodes(left: LayoutNode, right: LayoutNode) {
    return left.editorDepth - right.editorDepth
        || left.editorOrder - right.editorOrder
        || left.createdAt.localeCompare(right.createdAt)
        || left.id.localeCompare(right.id);
}

function getNodeSpriteLabel(node: LayoutNode) {
    if (!node.character || !node.characterSprite) {
        return null;
    }
    return node.characterSpriteId ? node.characterSprite.label : `${node.characterSprite.label} (default)`;
}

function getMaxDepth(nodes: LayoutNode[]) {
    if (nodes.length === 0) {
        return -1;
    }
    return Math.max(...nodes.map((node) => node.editorDepth), 0);
}

function getLaneCount(nodes: LayoutNode[], depth: number, excludeNodeId?: string | null) {
    return nodes.filter((node) => node.editorDepth === depth && node.id !== excludeNodeId).length;
}

function buildLayout(nodes: LayoutNode[]) {
    if (nodes.length === 0) {
        return {
            positionedNodes: [] as PositionedNode[],
            width: 920,
            height: 520,
        };
    }

    const groups = new Map<number, LayoutNode[]>();
    for (const node of nodes.slice().sort(compareLayoutNodes)) {
        const group = groups.get(node.editorDepth) ?? [];
        group.push(node);
        groups.set(node.editorDepth, group);
    }

    const positionedNodes: PositionedNode[] = [];
    const sortedDepths = [...groups.keys()].sort((left, right) => left - right);

    for (const depth of sortedDepths) {
        const group = groups.get(depth) ?? [];
        group.forEach((node, laneIndex) => {
            positionedNodes.push({
                ...node,
                laneIndex,
                x: canvasPadding + depth * (cardWidth + horizontalGap),
                y: canvasPadding + laneIndex * (cardHeight + verticalGap),
            });
        });
    }

    const maxColumn = Math.max(...positionedNodes.map((node) => node.editorDepth), 0);
    const maxRow = Math.max(...positionedNodes.map((node) => node.laneIndex), 0);

    return {
        positionedNodes,
        width: canvasPadding * 2 + (maxColumn + 1) * cardWidth + maxColumn * horizontalGap,
        height: canvasPadding * 2 + (maxRow + 1) * cardHeight + maxRow * verticalGap,
    };
}

function createGhostNode(storyId: string, editorDepth: number, editorOrder: number, text: string): LayoutNode {
    return {
        id: '__ghost-node__',
        storyId,
        characterId: null,
        characterSpriteId: null,
        backgroundId: null,
        editorDepth,
        editorOrder,
        text: text.trim() || 'New node',
        audioUrl: null,
        isStartNode: false,
        isEndNode: false,
        character: null,
        characterSprite: null,
        spriteImageUrl: null,
        background: null,
        backgroundImageUrl: null,
        choices: [],
        createdAt: '9999-12-31T00:00:00.000Z',
        updatedAt: '9999-12-31T00:00:00.000Z',
        isGhost: true,
    };
}

export default function StoryFlowEditorPage() {
    const params = useParams();
    const storyId = params.storyId as string;
    const canvasRef = useRef<HTMLDivElement | null>(null);
    const selectedNodeIdRef = useRef<string | null>(null);
    const dragStateRef = useRef<DragState | null>(null);
    const suppressClickNodeIdRef = useRef<string | null>(null);

    const [nodes, setNodes] = useState<NodeRecord[]>([]);
    const [characters, setCharacters] = useState<Character[]>([]);
    const [backgrounds, setBackgrounds] = useState<Background[]>([]);
    const [storyTitle, setStoryTitle] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [layoutSavingNodeId, setLayoutSavingNodeId] = useState<string | null>(null);
    const [dragState, setDragState] = useState<DragState | null>(null);
    const [isCreatingNode, setIsCreatingNode] = useState(false);

    const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
    const [nodeText, setNodeText] = useState('');
    const [nodeCharacterId, setNodeCharacterId] = useState('');
    const [nodeCharacterSpriteId, setNodeCharacterSpriteId] = useState('');
    const [nodeBackgroundId, setNodeBackgroundId] = useState('');
    const [nodeAudioUrl, setNodeAudioUrl] = useState('');
    const [nodeEditorDepth, setNodeEditorDepth] = useState(0);
    const [nodeEditorOrder, setNodeEditorOrder] = useState(0);
    const [nodeIsStart, setNodeIsStart] = useState(false);
    const [nodeIsEnd, setNodeIsEnd] = useState(false);

    const [editingChoiceId, setEditingChoiceId] = useState<string | null>(null);
    const [choiceText, setChoiceText] = useState('');
    const [choiceTargetNodeId, setChoiceTargetNodeId] = useState('');
    const [choiceScoreImpact, setChoiceScoreImpact] = useState(0);

    const imageAssets = useAssetLibrary('image');
    const audioAssets = useAssetLibrary('audio');

    useEffect(() => {
        selectedNodeIdRef.current = selectedNodeId;
    }, [selectedNodeId]);

    useEffect(() => {
        dragStateRef.current = dragState;
    }, [dragState]);

    const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? null;
    const totalChoices = nodes.reduce((sum, node) => sum + node.choices.length, 0);

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

    const resolvedSprite = useMemo(() => {
        if (!nodeCharacterId) {
            return null;
        }
        return availableSprites.find((sprite) => sprite.id === activeNodeCharacterSpriteId)
            ?? characters.find((character) => character.id === nodeCharacterId)?.defaultSprite
            ?? null;
    }, [activeNodeCharacterSpriteId, availableSprites, characters, nodeCharacterId]);

    const renderedNodes = useMemo<LayoutNode[]>(() => {
        if (!isCreatingNode) {
            return nodes;
        }
        return [...nodes, createGhostNode(storyId, nodeEditorDepth, nodeEditorOrder, nodeText)];
    }, [isCreatingNode, nodeEditorDepth, nodeEditorOrder, nodeText, nodes, storyId]);

    const layout = useMemo(() => buildLayout(renderedNodes), [renderedNodes]);
    const positions = useMemo(
        () => new Map(layout.positionedNodes.map((node) => [node.id, node])),
        [layout.positionedNodes]
    );

    const resetChoiceEditor = useCallback(() => {
        setEditingChoiceId(null);
        setChoiceText('');
        setChoiceTargetNodeId('');
        setChoiceScoreImpact(0);
    }, []);

    const getCreatePlacement = useCallback((currentNodes: NodeRecord[], anchorNodeId?: string | null) => {
        const anchorNode = anchorNodeId ? currentNodes.find((node) => node.id === anchorNodeId) ?? null : null;
        const editorDepth = anchorNode ? anchorNode.editorDepth + 1 : getMaxDepth(currentNodes) + 1;
        return {
            editorDepth: Math.max(0, editorDepth),
            editorOrder: getLaneCount(currentNodes, Math.max(0, editorDepth)),
        };
    }, []);

    const resetNodeEditor = useCallback(() => {
        setEditingNodeId(null);
        setSelectedNodeId(null);
        setNodeText('');
        setNodeCharacterId('');
        setNodeCharacterSpriteId('');
        setNodeBackgroundId('');
        setNodeAudioUrl('');
        setNodeEditorDepth(0);
        setNodeEditorOrder(0);
        setNodeIsStart(false);
        setNodeIsEnd(false);
        setIsCreatingNode(false);
        resetChoiceEditor();
    }, [resetChoiceEditor]);

    const populateNodeEditor = useCallback((node: NodeRecord) => {
        setEditingNodeId(node.id);
        setSelectedNodeId(node.id);
        setNodeText(node.text);
        setNodeCharacterId(node.characterId ?? '');
        setNodeCharacterSpriteId(node.characterSpriteId ?? '');
        setNodeBackgroundId(node.backgroundId ?? '');
        setNodeAudioUrl(node.audioUrl ?? '');
        setNodeEditorDepth(node.editorDepth);
        setNodeEditorOrder(node.editorOrder);
        setNodeIsStart(node.isStartNode);
        setNodeIsEnd(node.isEndNode);
        setIsCreatingNode(false);
        resetChoiceEditor();
    }, [resetChoiceEditor]);

    const beginCreateNode = useCallback(() => {
        const placement = getCreatePlacement(nodes, selectedNodeIdRef.current);
        setEditingNodeId(null);
        setNodeText('');
        setNodeCharacterId('');
        setNodeCharacterSpriteId('');
        setNodeBackgroundId('');
        setNodeAudioUrl('');
        setNodeEditorDepth(placement.editorDepth);
        setNodeEditorOrder(placement.editorOrder);
        setNodeIsStart(false);
        setNodeIsEnd(false);
        setIsCreatingNode(true);
        resetChoiceEditor();
    }, [getCreatePlacement, nodes, resetChoiceEditor]);

    const fetchEditorData = useCallback(async (preferredNodeId?: string | null) => {
        setLoading(true);
        try {
            const [nodesRes, charsRes, storiesRes, backgroundsRes] = await Promise.all([
                fetch(`/api/nodes?storyId=${storyId}`),
                fetch('/api/characters'),
                fetch('/api/stories'),
                fetch('/api/backgrounds'),
            ]);

            const nextNodes: NodeRecord[] = nodesRes.ok ? await nodesRes.json() : [];
            const nextCharacters: Character[] = charsRes.ok ? await charsRes.json() : [];
            const nextStories: { id: string; title: string }[] = storiesRes.ok ? await storiesRes.json() : [];
            const nextBackgrounds: Background[] = backgroundsRes.ok ? await backgroundsRes.json() : [];

            setNodes(nextNodes);
            setCharacters(nextCharacters);
            setBackgrounds(nextBackgrounds);
            setStoryTitle(nextStories.find((entry) => entry.id === storyId)?.title ?? 'Story Flow');

            const nextSelectedId = preferredNodeId ?? selectedNodeIdRef.current;
            const preferredNode = nextSelectedId ? nextNodes.find((node) => node.id === nextSelectedId) ?? null : null;
            if (preferredNode) {
                populateNodeEditor(preferredNode);
            } else if (nextNodes.length > 0) {
                const startNode = nextNodes.find((node) => node.isStartNode) ?? nextNodes[0];
                populateNodeEditor(startNode);
            } else {
                setEditingNodeId(null);
                setSelectedNodeId(null);
                setNodeText('');
                setNodeCharacterId('');
                setNodeCharacterSpriteId('');
                setNodeBackgroundId('');
                setNodeAudioUrl('');
                setNodeEditorDepth(0);
                setNodeEditorOrder(0);
                setNodeIsStart(false);
                setNodeIsEnd(false);
                setIsCreatingNode(true);
                resetChoiceEditor();
            }
        } finally {
            setLoading(false);
        }
    }, [populateNodeEditor, resetChoiceEditor, storyId]);

    useEffect(() => {
        fetchEditorData();
    }, [fetchEditorData]);

    function getLaneInsertOrder(targetDepth: number, excludeNodeId?: string | null) {
        return getLaneCount(nodes, targetDepth, excludeNodeId);
    }

    function handleDepthChange(nextDepth: number) {
        const clampedDepth = nodeIsStart ? 0 : Math.max(0, Math.floor(Number.isFinite(nextDepth) ? nextDepth : 0));
        if (clampedDepth !== nodeEditorDepth) {
            setNodeEditorOrder(getLaneInsertOrder(clampedDepth, editingNodeId));
        }
        setNodeEditorDepth(clampedDepth);
    }

    function handleStartNodeToggle(checked: boolean) {
        setNodeIsStart(checked);
        if (checked) {
            setNodeEditorDepth(0);
            setNodeEditorOrder(getLaneInsertOrder(0, editingNodeId));
        }
    }

    function handleCharacterChange(nextCharacterId: string) {
        setNodeCharacterId(nextCharacterId);
        const nextSprites = characters.find((character) => character.id === nextCharacterId)?.sprites ?? [];
        setNodeCharacterSpriteId((current) => (nextSprites.some((sprite) => sprite.id === current) ? current : ''));
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

    async function handleNodeSubmit(event: React.FormEvent) {
        event.preventDefault();
        if (!nodeText.trim()) {
            return;
        }

        setSaving(true);
        const payload = {
            storyId,
            characterId: nodeCharacterId || null,
            characterSpriteId: activeNodeCharacterSpriteId || null,
            backgroundId: nodeBackgroundId || null,
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

        setSaving(false);
        if (!response.ok) {
            return;
        }

        const node = await response.json();
        setIsCreatingNode(false);
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

    const persistNodeLayout = useCallback(async (nodeId: string, editorDepth: number, editorOrder: number) => {
        setLayoutSavingNodeId(nodeId);
        const response = await fetch(`/api/nodes/${nodeId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ editorDepth, editorOrder }),
        });
        setLayoutSavingNodeId(null);
        if (response.ok) {
            await fetchEditorData(nodeId);
        }
    }, [fetchEditorData]);

    const getDropPlacement = useCallback((node: NodeRecord, currentClientX: number, currentClientY: number) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        const positionedNode = positions.get(node.id);
        const currentDrag = dragStateRef.current;
        if (!rect || !positionedNode || !currentDrag) {
            return {
                editorDepth: node.editorDepth,
                editorOrder: node.editorOrder,
            };
        }

        const deltaX = currentClientX - currentDrag.startClientX;
        const deltaY = currentClientY - currentDrag.startClientY;
        const draggedX = currentDrag.startX + deltaX;
        const draggedY = currentDrag.startY + deltaY;
        const centerX = draggedX + cardWidth / 2;
        const centerY = draggedY + cardHeight / 2;

        const snappedDepth = Math.max(0, Math.round((centerX - canvasPadding) / (cardWidth + horizontalGap)));
        const editorDepth = node.isStartNode ? 0 : snappedDepth;
        const laneNodes = layout.positionedNodes
            .filter((entry) => !entry.isGhost && entry.id !== node.id && entry.editorDepth === editorDepth)
            .slice()
            .sort((left, right) => left.y - right.y);

        let editorOrder = laneNodes.length;
        for (let index = 0; index < laneNodes.length; index += 1) {
            if (centerY < laneNodes[index].y + cardHeight / 2) {
                editorOrder = index;
                break;
            }
        }

        return {
            editorDepth,
            editorOrder,
        };
    }, [layout.positionedNodes, positions]);

    useEffect(() => {
        if (!dragState?.nodeId) {
            return;
        }

        function handlePointerMove(event: PointerEvent) {
            setDragState((current) => current ? {
                ...current,
                currentClientX: event.clientX,
                currentClientY: event.clientY,
            } : null);
        }

        async function handlePointerUp(event: PointerEvent) {
            const currentDrag = dragStateRef.current;
            if (!currentDrag) {
                return;
            }
            const positionedNode = positions.get(currentDrag.nodeId);
            const node = nodes.find((entry) => entry.id === currentDrag.nodeId) ?? null;
            setDragState(null);

            if (!node || !positionedNode) {
                return;
            }

            const movedEnough = Math.abs(event.clientX - currentDrag.startClientX) > dragThreshold
                || Math.abs(event.clientY - currentDrag.startClientY) > dragThreshold;

            if (!movedEnough) {
                populateNodeEditor(node);
                return;
            }

            suppressClickNodeIdRef.current = node.id;
            window.setTimeout(() => {
                if (suppressClickNodeIdRef.current === node.id) {
                    suppressClickNodeIdRef.current = null;
                }
            }, 0);

            const placement = getDropPlacement(node, event.clientX, event.clientY);
            if (placement.editorDepth === node.editorDepth && placement.editorOrder === node.editorOrder) {
                return;
            }

            await persistNodeLayout(node.id, placement.editorDepth, placement.editorOrder);
        }

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp, { once: true });
        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };
    }, [dragState?.nodeId, getDropPlacement, nodes, persistNodeLayout, populateNodeEditor, positions]);

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

    function handleNodePointerDown(event: React.PointerEvent<HTMLDivElement>, node: NodeRecord) {
        if (event.button !== 0 || isCreatingNode || saving || layoutSavingNodeId) {
            return;
        }

        const positionedNode = positions.get(node.id);
        if (!positionedNode) {
            return;
        }

        setDragState({
            nodeId: node.id,
            pointerId: event.pointerId,
            startClientX: event.clientX,
            startClientY: event.clientY,
            startX: positionedNode.x,
            startY: positionedNode.y,
            currentClientX: event.clientX,
            currentClientY: event.clientY,
        });
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
                <Link href="/admin/backgrounds" className="btn btn-secondary" style={{ padding: '0.45rem 0.8rem', fontSize: '0.85rem' }}>
                    Manage Backgrounds
                </Link>
                <div>
                    <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '0.2rem' }}>
                        Flow Editor
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                        {storyTitle || 'Loading story'}: drag nodes between depth lanes, reorder inside a lane, and edit scene details from the sidebar.
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
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Depth Lanes</p>
                    <p style={{ fontSize: '1.9rem', fontWeight: 800 }}>{getMaxDepth(renderedNodes) + 1}</p>
                </div>
            </div>

            <div className="flow-editor-shell">
                <section className="flow-editor-canvas glass-panel">
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Story map</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                Drag horizontally to change depth, drag vertically to reorder, or use the depth control in the sidebar.
                            </p>
                        </div>
                        <button type="button" className="btn btn-primary" onClick={beginCreateNode}>
                            New Node
                        </button>
                    </div>

                    {loading ? (
                        <div className="animate-pulse" style={{ minHeight: '520px', borderRadius: '20px', background: 'rgba(255,255,255,0.04)' }} />
                    ) : renderedNodes.length === 0 ? (
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
                            <div ref={canvasRef} style={{ position: 'relative', minWidth: `${layout.width}px`, minHeight: `${layout.height}px` }}>
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
                                            const edgeColor = choice.scoreImpact > 0
                                                ? 'rgba(74, 222, 128, 0.7)'
                                                : choice.scoreImpact < 0
                                                    ? 'rgba(248, 113, 113, 0.7)'
                                                    : 'rgba(103, 232, 249, 0.58)';

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

                                {layout.positionedNodes.map((node) => {
                                    const isDragging = dragState?.nodeId === node.id;
                                    const translateX = isDragging ? dragState.currentClientX - dragState.startClientX : 0;
                                    const translateY = isDragging ? dragState.currentClientY - dragState.startClientY : 0;

                                    return (
                                        <div
                                            key={node.id}
                                            role={node.isGhost ? undefined : 'button'}
                                            tabIndex={node.isGhost ? -1 : 0}
                                            className={`flow-node-card${selectedNodeId === node.id ? ' is-selected' : ''}`}
                                            onClick={node.isGhost ? undefined : () => {
                                                if (suppressClickNodeIdRef.current === node.id) {
                                                    suppressClickNodeIdRef.current = null;
                                                    return;
                                                }
                                                populateNodeEditor(node);
                                            }}
                                            onPointerDown={node.isGhost ? undefined : (event) => handleNodePointerDown(event, node)}
                                            style={{
                                                left: `${node.x}px`,
                                                top: `${node.y}px`,
                                                cursor: node.isGhost ? 'default' : 'grab',
                                                opacity: node.isGhost ? 0.6 : (isDragging ? 0.96 : 1),
                                                borderStyle: node.isGhost ? 'dashed' : 'solid',
                                                boxShadow: isDragging ? '0 28px 48px rgba(0, 0, 0, 0.35)' : undefined,
                                                transform: `translate(${translateX}px, ${translateY}px)`,
                                                zIndex: isDragging ? 3 : node.isGhost ? 1 : 2,
                                                pointerEvents: layoutSavingNodeId ? 'none' : undefined,
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center', marginBottom: '0.6rem' }}>
                                                <span className={`badge ${node.isGhost ? 'badge-secondary' : node.isEndNode ? 'badge-danger' : node.isStartNode ? 'badge-success' : 'badge-secondary'}`}>
                                                    {node.isGhost ? 'Pending' : node.isStartNode ? 'Start' : node.isEndNode ? 'End' : `Depth ${node.editorDepth + 1}`}
                                                </span>
                                                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                                    {node.isGhost ? `Lane ${node.editorDepth + 1}` : `${node.choices.length} choice${node.choices.length === 1 ? '' : 's'}`}
                                                </span>
                                            </div>
                                            <h3 style={{ fontSize: '1rem', marginBottom: '0.35rem' }}>
                                                {node.character?.name ?? (node.isGhost ? 'New node' : 'Narrator')}
                                            </h3>
                                            {getNodeSpriteLabel(node) && (
                                                <p style={{ fontSize: '0.8rem', color: 'var(--secondary-light)', marginBottom: '0.35rem' }}>
                                                    {getNodeSpriteLabel(node)}
                                                </p>
                                            )}
                                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                                                {previewText(node.text)}
                                            </p>
                                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.8rem' }}>
                                                {!node.isGhost && node.spriteImageUrl && <span className="badge badge-primary">Sprite</span>}
                                                {!node.isGhost && node.background && <span className="badge badge-accent">{node.background.name}</span>}
                                                {!node.isGhost && node.audioUrl && <span className="badge badge-secondary">Audio</span>}
                                            </div>
                                        </div>
                                    );
                                })}
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
                                    {editingNodeId ? 'Editing the selected card from the flow map.' : 'Draft a node and place it in the lane shown on the canvas.'}
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {editingNodeId && (
                                    <button type="button" className="btn btn-secondary" onClick={beginCreateNode} style={{ padding: '0.45rem 0.7rem', fontSize: '0.8rem' }}>
                                        New
                                    </button>
                                )}
                                {(editingNodeId || isCreatingNode) && (
                                    <button type="button" className="btn btn-secondary" onClick={resetNodeEditor} style={{ padding: '0.45rem 0.7rem', fontSize: '0.8rem' }}>
                                        Clear
                                    </button>
                                )}
                            </div>
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
                                <label>Depth Lane</label>
                                <input
                                    type="number"
                                    min={0}
                                    value={nodeIsStart ? 0 : nodeEditorDepth}
                                    onChange={(event) => handleDepthChange(Number(event.target.value))}
                                    disabled={nodeIsStart}
                                />
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.3rem' }}>
                                    {nodeIsStart ? 'Start nodes are pinned to depth 1.' : `Current lane: Depth ${nodeEditorDepth + 1} · position ${nodeEditorOrder + 1}`}
                                </p>
                            </div>
                            <div>
                                <label>Character</label>
                                <select value={nodeCharacterId} onChange={(event) => handleCharacterChange(event.target.value)}>
                                    <option value="">Narrator</option>
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
                            {nodeCharacterId && (
                                <div style={{ display: 'grid', gridTemplateColumns: '84px minmax(0, 1fr)', gap: '0.8rem', alignItems: 'start' }}>
                                    <div style={{
                                        width: '84px',
                                        height: '112px',
                                        borderRadius: '12px',
                                        overflow: 'hidden',
                                        background: 'rgba(0,0,0,0.25)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        display: 'grid',
                                        placeItems: 'center',
                                    }}>
                                        {resolvedSprite?.imageUrl ? (
                                            <img
                                                src={resolvedSprite.imageUrl}
                                                alt="Sprite preview"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>No sprite</span>
                                        )}
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Resolved expression</p>
                                        <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                                            {resolvedSprite ? (activeNodeCharacterSpriteId ? resolvedSprite.label : `${resolvedSprite.label} (default)`) : 'No sprite assigned'}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <BackgroundSelectField
                                backgrounds={backgrounds}
                                value={nodeBackgroundId}
                                onChange={setNodeBackgroundId}
                                onQuickCreate={handleQuickCreateBackground}
                            />

                            <NodeAudioField
                                value={nodeAudioUrl}
                                onChange={setNodeAudioUrl}
                                assets={audioAssets.assets}
                                uploading={audioAssets.uploading}
                                uploadFiles={audioAssets.uploadFiles}
                            />

                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: 0 }}>
                                    <input type="checkbox" checked={nodeIsStart} onChange={(event) => handleStartNodeToggle(event.target.checked)} />
                                    Start node
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: 0 }}>
                                    <input type="checkbox" checked={nodeIsEnd} onChange={(event) => setNodeIsEnd(event.target.checked)} />
                                    End node
                                </label>
                            </div>
                            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                                <button type="submit" className="btn btn-primary" disabled={saving || layoutSavingNodeId !== null} style={{ flex: 1 }}>
                                    {saving ? 'Saving...' : editingNodeId ? 'Save Node' : 'Create Node'}
                                </button>
                                {editingNodeId && (
                                    <button type="button" className="btn btn-danger" onClick={handleDeleteNode} disabled={layoutSavingNodeId !== null}>
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
                </aside>
            </div>
        </div>
    );
}
