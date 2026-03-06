import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { deriveAssetLabel } from '@/lib/asset-utils';

export interface StoryRecord {
    id: string;
    title: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CharacterRecord {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    spriteImageUrl?: string | null;
}

export interface CharacterSpriteRecord {
    id: string;
    characterId: string;
    label: string;
    imageUrl: string;
    isDefault: boolean;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
}

export interface BackgroundRecord {
    id: string;
    name: string;
    imageUrl: string;
    createdAt: string;
    updatedAt: string;
}

export type CharacterWithSprites = Omit<CharacterRecord, 'spriteImageUrl'> & {
    sprites: CharacterSpriteRecord[];
    defaultSprite: CharacterSpriteRecord | null;
};

export interface NodeRecord {
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
    createdAt: string;
    updatedAt: string;
}

export interface ChoiceRecord {
    id: string;
    nodeId: string;
    targetNodeId: string | null;
    text: string;
    scoreImpact: number;
    createdAt: string;
    updatedAt: string;
}

export interface PlayerScoreRecord {
    id: string;
    name: string;
    score: number;
    createdAt: string;
}

export interface SiteSettingsRecord {
    publicLocale: 'id' | 'en';
}

export interface HydratedNodeRecord extends NodeRecord {
    character: CharacterWithSprites | null;
    characterSprite: CharacterSpriteRecord | null;
    spriteImageUrl: string | null;
    background: BackgroundRecord | null;
    backgroundImageUrl: string | null;
    choices: ChoiceRecord[];
}

interface DatabaseShape {
    stories: StoryRecord[];
    characters: CharacterRecord[];
    characterSprites: CharacterSpriteRecord[];
    backgrounds: BackgroundRecord[];
    nodes: NodeRecord[];
    choices: ChoiceRecord[];
    playerScores: PlayerScoreRecord[];
    siteSettings: SiteSettingsRecord;
}

type LegacyCharacterRecord = CharacterRecord & {
    spriteImageUrl?: string | null;
};

type LegacyNodeRecord = Omit<NodeRecord, 'characterSpriteId' | 'backgroundId'> & {
    characterSpriteId?: string | null;
    backgroundId?: string | null;
    editorDepth?: number | null;
    editorOrder?: number | null;
    backgroundImageUrl?: string | null;
};

type LegacyDatabaseShape = Partial<Omit<DatabaseShape, 'characters' | 'nodes'>> & {
    characters?: LegacyCharacterRecord[];
    nodes?: LegacyNodeRecord[];
    siteSettings?: Partial<SiteSettingsRecord>;
};

interface CharacterSpriteInput {
    id?: string | null;
    label?: string | null;
    imageUrl?: string | null;
    isDefault?: boolean;
    sortOrder?: number;
}

const dataDir = path.join(process.cwd(), 'data');
const dataFile = path.join(dataDir, 'db.json');

function normalizePublicLocale(locale: string | null | undefined): 'id' | 'en' {
    return locale === 'en' ? 'en' : 'id';
}

function nowIso() {
    return new Date().toISOString();
}

function stripLegacyCharacterField(character: LegacyCharacterRecord): CharacterRecord {
    return {
        id: character.id,
        name: character.name,
        createdAt: character.createdAt,
        updatedAt: character.updatedAt,
    };
}

function compareSprites(left: CharacterSpriteRecord, right: CharacterSpriteRecord) {
    return left.sortOrder - right.sortOrder
        || left.createdAt.localeCompare(right.createdAt)
        || left.label.localeCompare(right.label);
}

function compareBackgrounds(left: BackgroundRecord, right: BackgroundRecord) {
    return right.createdAt.localeCompare(left.createdAt)
        || left.name.localeCompare(right.name);
}

function listSpritesForCharacter(characterId: string, db: DatabaseShape) {
    return db.characterSprites
        .filter((sprite) => sprite.characterId === characterId)
        .slice()
        .sort(compareSprites);
}

function findBackgroundById(backgroundId: string | null | undefined, db: DatabaseShape) {
    if (!backgroundId) {
        return null;
    }
    return db.backgrounds.find((background) => background.id === backgroundId) ?? null;
}

function findBackgroundByUrl(imageUrl: string | null | undefined, db: DatabaseShape) {
    if (!imageUrl) {
        return null;
    }
    return db.backgrounds.find((background) => background.imageUrl === imageUrl) ?? null;
}

function createBackgroundRecord(imageUrl: string, timestamp: string, name?: string | null): BackgroundRecord {
    return {
        id: randomUUID(),
        name: name?.trim() || deriveAssetLabel(imageUrl, 'Background'),
        imageUrl,
        createdAt: timestamp,
        updatedAt: timestamp,
    };
}

function ensureBackgroundForUrl(db: DatabaseShape, imageUrl: string | null | undefined, timestamp: string, name?: string | null) {
    const normalizedUrl = imageUrl?.trim() || '';
    if (!normalizedUrl) {
        return null;
    }

    const existing = findBackgroundByUrl(normalizedUrl, db);
    if (existing) {
        return existing;
    }

    const background = createBackgroundRecord(normalizedUrl, timestamp, name);
    db.backgrounds.push(background);
    return background;
}

function hydrateCharacter(character: CharacterRecord, db: DatabaseShape): CharacterWithSprites {
    const sprites = listSpritesForCharacter(character.id, db);
    return {
        id: character.id,
        name: character.name,
        createdAt: character.createdAt,
        updatedAt: character.updatedAt,
        sprites,
        defaultSprite: sprites.find((sprite) => sprite.isDefault) ?? sprites[0] ?? null,
    };
}

function hydrateNode(node: NodeRecord, db: DatabaseShape): HydratedNodeRecord {
    const choices = db.choices
        .filter((choice) => choice.nodeId === node.id)
        .sort((left, right) => left.createdAt.localeCompare(right.createdAt));

    const characterRecord = node.characterId
        ? db.characters.find((entry) => entry.id === node.characterId) ?? null
        : null;
    const character = characterRecord ? hydrateCharacter(characterRecord, db) : null;
    const characterSprite = character
        ? (node.characterSpriteId
            ? db.characterSprites.find((sprite) => sprite.id === node.characterSpriteId && sprite.characterId === character.id) ?? null
            : null) ?? character.defaultSprite
        : null;
    const background = findBackgroundById(node.backgroundId, db);

    return {
        ...node,
        character,
        characterSprite,
        spriteImageUrl: characterSprite?.imageUrl ?? null,
        background,
        backgroundImageUrl: background?.imageUrl ?? null,
        choices,
    };
}

function normalizeSpriteDrafts(drafts: CharacterSpriteInput[]): Array<{
    id: string | null;
    label: string;
    imageUrl: string;
    isDefault: boolean;
    sortOrder: number;
}> {
    const normalized = drafts
        .map((sprite, index) => ({
            id: typeof sprite.id === 'string' && sprite.id.trim() ? sprite.id.trim() : null,
            label: sprite.label?.trim() || `Sprite ${index + 1}`,
            imageUrl: sprite.imageUrl?.trim() || '',
            isDefault: Boolean(sprite.isDefault),
        }))
        .filter((sprite) => sprite.imageUrl);

    if (normalized.length === 0) {
        return [];
    }

    const preferredDefaultIndex = normalized.findIndex((sprite) => sprite.isDefault);
    const defaultIndex = preferredDefaultIndex >= 0 ? preferredDefaultIndex : 0;

    return normalized.map((sprite, index) => ({
        ...sprite,
        isDefault: index === defaultIndex,
        sortOrder: index,
    }));
}

function materializeSprites(
    characterId: string,
    drafts: CharacterSpriteInput[],
    existingSprites: CharacterSpriteRecord[],
    timestamp: string
) {
    const normalizedDrafts = normalizeSpriteDrafts(drafts);
    const existingById = new Map(existingSprites.map((sprite) => [sprite.id, sprite]));

    return normalizedDrafts.map((sprite) => {
        const existing = sprite.id ? existingById.get(sprite.id) : undefined;
        return {
            id: existing?.id ?? sprite.id ?? randomUUID(),
            characterId,
            label: sprite.label,
            imageUrl: sprite.imageUrl,
            isDefault: sprite.isDefault,
            sortOrder: sprite.sortOrder,
            createdAt: existing?.createdAt ?? timestamp,
            updatedAt: timestamp,
        };
    });
}

function buildCharacterSpritesFromInput(
    characterId: string,
    input: { spriteImageUrl?: string | null; sprites?: CharacterSpriteInput[] },
    existingSprites: CharacterSpriteRecord[],
    timestamp: string
) {
    if (Array.isArray(input.sprites)) {
        return materializeSprites(characterId, input.sprites, existingSprites, timestamp);
    }

    if (typeof input.spriteImageUrl !== 'undefined') {
        const legacyUrl = input.spriteImageUrl?.trim() || '';
        return legacyUrl
            ? materializeSprites(characterId, [{ label: 'Default', imageUrl: legacyUrl, isDefault: true, sortOrder: 0 }], existingSprites, timestamp)
            : [];
    }

    return existingSprites
        .slice()
        .sort(compareSprites)
        .map((sprite) => ({
            ...sprite,
            updatedAt: timestamp,
        }));
}

function normalizeCharacterSelection(
    db: DatabaseShape,
    input: { characterId?: string | null; characterSpriteId?: string | null }
) {
    const characterId = input.characterId?.trim() || null;
    if (!characterId) {
        return {
            characterId: null,
            characterSpriteId: null,
        };
    }

    const character = db.characters.find((entry) => entry.id === characterId);
    if (!character) {
        return {
            characterId: null,
            characterSpriteId: null,
        };
    }

    const characterSpriteId = input.characterSpriteId?.trim() || null;
    if (!characterSpriteId) {
        return {
            characterId,
            characterSpriteId: null,
        };
    }

    const sprite = db.characterSprites.find((entry) => entry.id === characterSpriteId);
    if (!sprite || sprite.characterId !== characterId) {
        return {
            characterId,
            characterSpriteId: null,
        };
    }

    return {
        characterId,
        characterSpriteId,
    };
}

function normalizeBackgroundSelection(
    db: DatabaseShape,
    input: { backgroundId?: string | null; backgroundImageUrl?: string | null },
    timestamp: string
) {
    const backgroundId = input.backgroundId?.trim() || null;
    if (backgroundId) {
        const background = findBackgroundById(backgroundId, db);
        if (background) {
            return background.id;
        }
    }

    const backgroundFromUrl = ensureBackgroundForUrl(db, input.backgroundImageUrl, timestamp);
    return backgroundFromUrl?.id ?? null;
}

function deriveLegacyEditorLayout(rawNodes: LegacyNodeRecord[], choices: ChoiceRecord[]) {
    const storyNodes = new Map<string, LegacyNodeRecord[]>();

    for (const node of rawNodes) {
        const group = storyNodes.get(node.storyId) ?? [];
        group.push(node);
        storyNodes.set(node.storyId, group);
    }

    const layoutByNodeId = new Map<string, { editorDepth: number; editorOrder: number }>();

    for (const [, nodes] of storyNodes.entries()) {
        if (nodes.length === 0) {
            continue;
        }

        const nodeIds = new Set(nodes.map((node) => node.id));
        const adjacency = new Map<string, string[]>();

        for (const node of nodes) {
            adjacency.set(
                node.id,
                choices
                    .filter((choice) => choice.nodeId === node.id)
                    .map((choice) => choice.targetNodeId)
                    .filter((targetNodeId): targetNodeId is string => targetNodeId !== null && nodeIds.has(targetNodeId))
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

        const groups = new Map<number, LegacyNodeRecord[]>();
        for (const node of nodes) {
            const depth = node.isStartNode ? 0 : Math.max(0, depthById.get(node.id) ?? 0);
            const group = groups.get(depth) ?? [];
            group.push(node);
            groups.set(depth, group);
        }

        for (const [depth, group] of groups.entries()) {
            group.sort((left, right) => {
                if (left.isStartNode !== right.isStartNode) {
                    return left.isStartNode ? -1 : 1;
                }
                if (left.isEndNode !== right.isEndNode) {
                    return left.isEndNode ? 1 : -1;
                }
                return left.text.localeCompare(right.text);
            });

            group.forEach((node, index) => {
                layoutByNodeId.set(node.id, {
                    editorDepth: depth,
                    editorOrder: index,
                });
            });
        }
    }

    return layoutByNodeId;
}

function clampEditorDepth(value: number, isStartNode: boolean) {
    if (isStartNode) {
        return 0;
    }
    return Math.max(0, value);
}

function compareNodeLayout(left: NodeRecord, right: NodeRecord) {
    return left.editorDepth - right.editorDepth
        || left.editorOrder - right.editorOrder
        || left.createdAt.localeCompare(right.createdAt)
        || left.id.localeCompare(right.id);
}

function reindexStoryLayout(db: DatabaseShape, storyId: string) {
    const storyNodes = db.nodes
        .filter((node) => node.storyId === storyId)
        .slice()
        .sort(compareNodeLayout);

    const orderByDepth = new Map<number, number>();
    for (const node of storyNodes) {
        node.editorDepth = clampEditorDepth(node.editorDepth, node.isStartNode);
        const nextOrder = orderByDepth.get(node.editorDepth) ?? 0;
        if (node.editorOrder !== nextOrder) {
            node.editorOrder = nextOrder;
        }
        orderByDepth.set(node.editorDepth, nextOrder + 1);
    }
}

function getNextLayoutDefaults(
    db: DatabaseShape,
    storyId: string,
    input: { editorDepth?: number | null; editorOrder?: number | null; isStartNode?: boolean }
) {
    const storyNodes = db.nodes.filter((node) => node.storyId === storyId);
    const explicitDepth = typeof input.editorDepth === 'number' && Number.isFinite(input.editorDepth)
        ? Math.floor(input.editorDepth)
        : null;
    const maxExistingDepth = storyNodes.length > 0
        ? Math.max(...storyNodes.map((node) => node.editorDepth), 0)
        : -1;
    const editorDepth = clampEditorDepth(explicitDepth ?? maxExistingDepth + 1, Boolean(input.isStartNode));
    const laneNodes = storyNodes
        .filter((node) => node.editorDepth === editorDepth)
        .slice()
        .sort(compareNodeLayout);
    const explicitOrder = typeof input.editorOrder === 'number' && Number.isFinite(input.editorOrder)
        ? Math.floor(input.editorOrder)
        : laneNodes.length;
    const editorOrder = Math.max(0, Math.min(explicitOrder, laneNodes.length));

    return { editorDepth, editorOrder };
}

function applyNodeLayoutUpdate(
    db: DatabaseShape,
    node: NodeRecord,
    input: { editorDepth?: number | null; editorOrder?: number | null; isStartNode?: boolean },
    timestamp: string
) {
    const storyNodes = db.nodes.filter((entry) => entry.storyId === node.storyId && entry.id !== node.id);
    const explicitDepth = typeof input.editorDepth === 'number' && Number.isFinite(input.editorDepth)
        ? Math.floor(input.editorDepth)
        : node.editorDepth;
    const editorDepth = clampEditorDepth(explicitDepth, Boolean(input.isStartNode ?? node.isStartNode));
    const laneNodes = storyNodes
        .filter((entry) => entry.editorDepth === editorDepth)
        .slice()
        .sort(compareNodeLayout);
    const explicitOrder = typeof input.editorOrder === 'number' && Number.isFinite(input.editorOrder)
        ? Math.floor(input.editorOrder)
        : node.editorOrder;
    const editorOrder = Math.max(0, Math.min(explicitOrder, laneNodes.length));

    for (const entry of laneNodes) {
        if (entry.editorOrder >= editorOrder) {
            entry.editorOrder += 1;
        }
    }

    node.editorDepth = editorDepth;
    node.editorOrder = editorOrder;
    node.updatedAt = timestamp;
    reindexStoryLayout(db, node.storyId);
}

function normalizeDatabase(raw: LegacyDatabaseShape) {
    let changed = false;
    const timestamp = nowIso();

    const stories = Array.isArray(raw.stories) ? raw.stories.slice() : [];
    const rawCharacters = Array.isArray(raw.characters) ? raw.characters : [];
    const characters = rawCharacters.map(stripLegacyCharacterField);
    const rawSprites = Array.isArray(raw.characterSprites) ? raw.characterSprites : [];
    const rawBackgrounds = Array.isArray(raw.backgrounds) ? raw.backgrounds : [];
    const characterSprites: CharacterSpriteRecord[] = [];
    const backgrounds: BackgroundRecord[] = [];
    const nodes: NodeRecord[] = [];
    const choices = Array.isArray(raw.choices) ? raw.choices.slice() : [];
    const playerScores = Array.isArray(raw.playerScores) ? raw.playerScores.slice() : [];
    const siteSettings: SiteSettingsRecord = {
        publicLocale: normalizePublicLocale(raw.siteSettings?.publicLocale),
    };

    if (!Array.isArray(raw.characterSprites) || !Array.isArray(raw.backgrounds) || !raw.siteSettings) {
        changed = true;
    }

    for (const [index, sprite] of rawSprites.entries()) {
        const normalizedImageUrl = sprite.imageUrl?.trim() || '';
        if (!normalizedImageUrl) {
            changed = true;
            continue;
        }

        characterSprites.push({
            id: sprite.id?.trim() || randomUUID(),
            characterId: sprite.characterId?.trim() || '',
            label: sprite.label?.trim() || `Sprite ${index + 1}`,
            imageUrl: normalizedImageUrl,
            isDefault: Boolean(sprite.isDefault),
            sortOrder: Number.isFinite(sprite.sortOrder) ? Number(sprite.sortOrder) : index,
            createdAt: sprite.createdAt || timestamp,
            updatedAt: sprite.updatedAt || sprite.createdAt || timestamp,
        });
    }

    for (const background of rawBackgrounds) {
        const normalizedUrl = background.imageUrl?.trim() || '';
        if (!normalizedUrl) {
            changed = true;
            continue;
        }

        backgrounds.push({
            id: background.id?.trim() || randomUUID(),
            name: background.name?.trim() || deriveAssetLabel(normalizedUrl, 'Background'),
            imageUrl: normalizedUrl,
            createdAt: background.createdAt || timestamp,
            updatedAt: background.updatedAt || background.createdAt || timestamp,
        });
    }

    const validCharacterIds = new Set(characters.map((character) => character.id));
    const filteredSprites = characterSprites.filter((sprite) => validCharacterIds.has(sprite.characterId));
    if (filteredSprites.length !== characterSprites.length) {
        changed = true;
    }

    const db: DatabaseShape = {
        stories,
        characters,
        characterSprites: filteredSprites,
        backgrounds,
        nodes,
        choices,
        playerScores,
        siteSettings,
    };

    for (const character of rawCharacters) {
        const legacySpriteUrl = character.spriteImageUrl?.trim();
        const existingSprites = listSpritesForCharacter(character.id, db);
        if (legacySpriteUrl && existingSprites.length === 0) {
            db.characterSprites.push({
                id: `${character.id}-default-sprite`,
                characterId: character.id,
                label: 'Default',
                imageUrl: legacySpriteUrl,
                isDefault: true,
                sortOrder: 0,
                createdAt: character.createdAt || timestamp,
                updatedAt: character.updatedAt || character.createdAt || timestamp,
            });
            changed = true;
        }

        if (typeof character.spriteImageUrl !== 'undefined') {
            changed = true;
        }
    }

    for (const character of db.characters) {
        const sprites = listSpritesForCharacter(character.id, db);
        if (sprites.length === 0) {
            continue;
        }

        const preferredDefault = sprites.find((sprite) => sprite.isDefault) ?? sprites[0];
        sprites.forEach((sprite, index) => {
            if (sprite.isDefault !== (sprite.id === preferredDefault.id)) {
                sprite.isDefault = sprite.id === preferredDefault.id;
                changed = true;
            }
            if (sprite.sortOrder !== index) {
                sprite.sortOrder = index;
                changed = true;
            }
        });
    }

    const rawNodes = Array.isArray(raw.nodes) ? raw.nodes : [];
    const legacyLayout = deriveLegacyEditorLayout(rawNodes, choices);
    for (const legacyNode of rawNodes) {
        const fallbackLayout = legacyLayout.get(legacyNode.id);
        const normalizedEditorDepth = typeof legacyNode.editorDepth === 'number' && Number.isFinite(legacyNode.editorDepth)
            ? Math.floor(legacyNode.editorDepth)
            : fallbackLayout?.editorDepth ?? 0;
        const normalizedEditorOrder = typeof legacyNode.editorOrder === 'number' && Number.isFinite(legacyNode.editorOrder)
            ? Math.floor(legacyNode.editorOrder)
            : fallbackLayout?.editorOrder ?? 0;
        const normalizedNode: NodeRecord = {
            id: legacyNode.id,
            storyId: legacyNode.storyId,
            characterId: legacyNode.characterId?.trim() || null,
            characterSpriteId: legacyNode.characterSpriteId?.trim() || null,
            backgroundId: legacyNode.backgroundId?.trim() || null,
            editorDepth: normalizedEditorDepth,
            editorOrder: normalizedEditorOrder,
            text: legacyNode.text,
            audioUrl: legacyNode.audioUrl?.trim() || null,
            isStartNode: Boolean(legacyNode.isStartNode),
            isEndNode: Boolean(legacyNode.isEndNode),
            createdAt: legacyNode.createdAt,
            updatedAt: legacyNode.updatedAt,
        };

        if (typeof legacyNode.characterSpriteId === 'undefined'
            || typeof legacyNode.backgroundId === 'undefined'
            || typeof legacyNode.editorDepth === 'undefined'
            || typeof legacyNode.editorOrder === 'undefined'
            || typeof legacyNode.backgroundImageUrl !== 'undefined') {
            changed = true;
        }

        if (normalizedNode.characterId && !validCharacterIds.has(normalizedNode.characterId)) {
            normalizedNode.characterId = null;
            normalizedNode.characterSpriteId = null;
            changed = true;
        }

        if (!normalizedNode.characterId && normalizedNode.characterSpriteId) {
            normalizedNode.characterSpriteId = null;
            changed = true;
        }

        if (normalizedNode.characterId && normalizedNode.characterSpriteId) {
            const sprite = db.characterSprites.find((entry) => entry.id === normalizedNode.characterSpriteId);
            if (!sprite || sprite.characterId !== normalizedNode.characterId) {
                normalizedNode.characterSpriteId = null;
                changed = true;
            }
        }

        if (normalizedNode.backgroundId && !findBackgroundById(normalizedNode.backgroundId, db)) {
            normalizedNode.backgroundId = null;
            changed = true;
        }

        const nextDepth = clampEditorDepth(normalizedNode.editorDepth, normalizedNode.isStartNode);
        if (nextDepth !== normalizedNode.editorDepth) {
            normalizedNode.editorDepth = nextDepth;
            changed = true;
        }

        if (normalizedNode.editorOrder < 0) {
            normalizedNode.editorOrder = 0;
            changed = true;
        }

        if (!normalizedNode.backgroundId) {
            const background = ensureBackgroundForUrl(db, legacyNode.backgroundImageUrl, timestamp);
            if (background) {
                normalizedNode.backgroundId = background.id;
                changed = true;
            }
        }

        nodes.push(normalizedNode);
    }

    for (const story of db.stories) {
        reindexStoryLayout(db, story.id);
    }

    return { db, changed };
}

function seedDatabase(): DatabaseShape {
    const createdAt = nowIso();

    return {
        stories: [
            {
                id: 'story-demo-merdeka',
                title: 'The Debate at Merdeka Hall',
                description: 'A short branching political drama about transit, public trust, and who pays for progress.',
                createdAt,
                updatedAt: createdAt,
            },
        ],
        characters: [
            {
                id: 'char-amira',
                name: 'Amira Rahman',
                createdAt,
                updatedAt: createdAt,
            },
            {
                id: 'char-bima',
                name: 'Bima Hartono',
                createdAt,
                updatedAt: createdAt,
            },
        ],
        characterSprites: [
            {
                id: 'char-amira-default',
                characterId: 'char-amira',
                label: 'Default',
                imageUrl: '/demo/amira-portrait.svg',
                isDefault: true,
                sortOrder: 0,
                createdAt,
                updatedAt: createdAt,
            },
            {
                id: 'char-amira-smile',
                characterId: 'char-amira',
                label: 'Smile',
                imageUrl: '/demo/amira-smile.svg',
                isDefault: false,
                sortOrder: 1,
                createdAt,
                updatedAt: createdAt,
            },
            {
                id: 'char-amira-determined',
                characterId: 'char-amira',
                label: 'Determined',
                imageUrl: '/demo/amira-determined.svg',
                isDefault: false,
                sortOrder: 2,
                createdAt,
                updatedAt: createdAt,
            },
            {
                id: 'char-bima-default',
                characterId: 'char-bima',
                label: 'Default',
                imageUrl: '/demo/bima-portrait.svg',
                isDefault: true,
                sortOrder: 0,
                createdAt,
                updatedAt: createdAt,
            },
            {
                id: 'char-bima-concerned',
                characterId: 'char-bima',
                label: 'Concerned',
                imageUrl: '/demo/bima-concerned.svg',
                isDefault: false,
                sortOrder: 1,
                createdAt,
                updatedAt: createdAt,
            },
            {
                id: 'char-bima-rally',
                characterId: 'char-bima',
                label: 'Rally',
                imageUrl: '/demo/bima-rally.svg',
                isDefault: false,
                sortOrder: 2,
                createdAt,
                updatedAt: createdAt,
            },
        ],
        backgrounds: [
            {
                id: 'bg-merdeka-hall',
                name: 'Merdeka Hall',
                imageUrl: '/demo/hall-bg.svg',
                createdAt,
                updatedAt: createdAt,
            },
            {
                id: 'bg-debate-stage',
                name: 'Debate Stage',
                imageUrl: '/demo/debate-bg.svg',
                createdAt,
                updatedAt: createdAt,
            },
            {
                id: 'bg-community-floor',
                name: 'Community Floor',
                imageUrl: '/demo/community-bg.svg',
                createdAt,
                updatedAt: createdAt,
            },
            {
                id: 'bg-night-closing',
                name: 'Night Closing',
                imageUrl: '/demo/night-bg.svg',
                createdAt,
                updatedAt: createdAt,
            },
        ],
        nodes: [
            {
                id: 'node-opening',
                storyId: 'story-demo-merdeka',
                characterId: null,
                characterSpriteId: null,
                backgroundId: 'bg-merdeka-hall',
                editorDepth: 0,
                editorOrder: 0,
                text: 'Rain presses against the glass roof of Merdeka Hall as students, journalists, and city workers fill the chamber. Tonight, your campaign will either earn trust or lose the room.',
                audioUrl: null,
                isStartNode: true,
                isEndNode: false,
                createdAt,
                updatedAt: createdAt,
            },
            {
                id: 'node-amira-pitch',
                storyId: 'story-demo-merdeka',
                characterId: 'char-amira',
                characterSpriteId: null,
                backgroundId: 'bg-debate-stage',
                editorDepth: 1,
                editorOrder: 0,
                text: 'Amira straightens a stack of notes. "We can cut commute times in half with an electric tram loop, but only if we protect the neighborhoods it passes through."',
                audioUrl: null,
                isStartNode: false,
                isEndNode: false,
                createdAt,
                updatedAt: createdAt,
            },
            {
                id: 'node-bima-pushback',
                storyId: 'story-demo-merdeka',
                characterId: 'char-bima',
                characterSpriteId: 'char-bima-concerned',
                backgroundId: 'bg-debate-stage',
                editorDepth: 1,
                editorOrder: 1,
                text: 'Bima leans into the microphone. "People want relief now. Freeze fares, pause the construction, and stop asking working families to gamble on a promise."',
                audioUrl: null,
                isStartNode: false,
                isEndNode: false,
                createdAt,
                updatedAt: createdAt,
            },
            {
                id: 'node-community-route',
                storyId: 'story-demo-merdeka',
                characterId: 'char-amira',
                characterSpriteId: 'char-amira-smile',
                backgroundId: 'bg-community-floor',
                editorDepth: 2,
                editorOrder: 0,
                text: 'You back a neighborhood-first plan: phased construction, rent protections near stations, and a citizen oversight board. The crowd softens. Several union leaders begin taking notes.',
                audioUrl: null,
                isStartNode: false,
                isEndNode: false,
                createdAt,
                updatedAt: createdAt,
            },
            {
                id: 'node-populist-route',
                storyId: 'story-demo-merdeka',
                characterId: 'char-bima',
                characterSpriteId: 'char-bima-rally',
                backgroundId: 'bg-community-floor',
                editorDepth: 2,
                editorOrder: 1,
                text: 'You endorse a fare freeze with no replacement funding. The applause is loud, but a transport analyst in the front row whispers that the buses will start failing within months.',
                audioUrl: null,
                isStartNode: false,
                isEndNode: false,
                createdAt,
                updatedAt: createdAt,
            },
            {
                id: 'node-reform-ending',
                storyId: 'story-demo-merdeka',
                characterId: 'char-amira',
                characterSpriteId: 'char-amira-determined',
                backgroundId: 'bg-night-closing',
                editorDepth: 3,
                editorOrder: 0,
                text: 'By midnight, the headline reads: "Candidate Trades Speed for Trust, Wins the Room." The plan is slower, harder, and politically expensive, but people believe it belongs to them.',
                audioUrl: null,
                isStartNode: false,
                isEndNode: true,
                createdAt,
                updatedAt: createdAt,
            },
            {
                id: 'node-collapse-ending',
                storyId: 'story-demo-merdeka',
                characterId: 'char-bima',
                characterSpriteId: 'char-bima-concerned',
                backgroundId: 'bg-night-closing',
                editorDepth: 3,
                editorOrder: 1,
                text: 'Three weeks later the temporary fare freeze collapses under debt pressure. Your rally clips still trend online, but riders are angrier than before and trust is harder to rebuild.',
                audioUrl: null,
                isStartNode: false,
                isEndNode: true,
                createdAt,
                updatedAt: createdAt,
            },
        ],
        choices: [
            {
                id: 'choice-opening-1',
                nodeId: 'node-opening',
                targetNodeId: 'node-amira-pitch',
                text: 'Open with an ambitious infrastructure case.',
                scoreImpact: 1,
                createdAt,
                updatedAt: createdAt,
            },
            {
                id: 'choice-opening-2',
                nodeId: 'node-opening',
                targetNodeId: 'node-bima-pushback',
                text: 'Open with immediate cost-of-living relief.',
                scoreImpact: 0,
                createdAt,
                updatedAt: createdAt,
            },
            {
                id: 'choice-amira-1',
                nodeId: 'node-amira-pitch',
                targetNodeId: 'node-community-route',
                text: 'Promise rent protections and public oversight.',
                scoreImpact: 3,
                createdAt,
                updatedAt: createdAt,
            },
            {
                id: 'choice-amira-2',
                nodeId: 'node-amira-pitch',
                targetNodeId: 'node-populist-route',
                text: 'Cut corners and promise the tram will pay for itself.',
                scoreImpact: -2,
                createdAt,
                updatedAt: createdAt,
            },
            {
                id: 'choice-bima-1',
                nodeId: 'node-bima-pushback',
                targetNodeId: 'node-community-route',
                text: 'Shift to a funded compromise before the room turns.',
                scoreImpact: 2,
                createdAt,
                updatedAt: createdAt,
            },
            {
                id: 'choice-bima-2',
                nodeId: 'node-bima-pushback',
                targetNodeId: 'node-populist-route',
                text: 'Double down on a crowd-pleasing freeze.',
                scoreImpact: -3,
                createdAt,
                updatedAt: createdAt,
            },
            {
                id: 'choice-community-1',
                nodeId: 'node-community-route',
                targetNodeId: 'node-reform-ending',
                text: 'Invite civic groups to co-sign the plan.',
                scoreImpact: 2,
                createdAt,
                updatedAt: createdAt,
            },
            {
                id: 'choice-populist-1',
                nodeId: 'node-populist-route',
                targetNodeId: 'node-collapse-ending',
                text: 'Run with the slogan and hope the numbers work later.',
                scoreImpact: -2,
                createdAt,
                updatedAt: createdAt,
            },
        ],
        playerScores: [],
        siteSettings: {
            publicLocale: 'id',
        },
    };
}

async function writeDatabase(db: DatabaseShape) {
    await mkdir(dataDir, { recursive: true });
    const sanitized: DatabaseShape = {
        stories: db.stories,
        characters: db.characters.map(stripLegacyCharacterField),
        characterSprites: db.characterSprites.slice().sort(compareSprites),
        backgrounds: db.backgrounds.slice().sort(compareBackgrounds),
        nodes: db.nodes,
        choices: db.choices,
        playerScores: db.playerScores,
        siteSettings: db.siteSettings,
    };
    await writeFile(dataFile, JSON.stringify(sanitized, null, 2));
}

async function readDatabase(): Promise<DatabaseShape> {
    try {
        const raw = await readFile(dataFile, 'utf8');
        const { db, changed } = normalizeDatabase(JSON.parse(raw) as LegacyDatabaseShape);
        if (db.stories.length > 0) {
            if (changed) {
                await writeDatabase(db);
            }
            return db;
        }
    } catch {
        // Fall through to seed creation.
    }

    const seeded = seedDatabase();
    await writeDatabase(seeded);
    return seeded;
}

export async function listStories() {
    const db = await readDatabase();
    return db.stories
        .slice()
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
        .map((story) => ({
            ...story,
            nodes: db.nodes.filter((node) => node.storyId === story.id),
        }));
}

export async function getSiteSettings() {
    const db = await readDatabase();
    return db.siteSettings;
}

export async function updateSiteSettings(input: Partial<SiteSettingsRecord>) {
    const db = await readDatabase();
    db.siteSettings = {
        ...db.siteSettings,
        publicLocale: normalizePublicLocale(input.publicLocale),
    };
    await writeDatabase(db);
    return db.siteSettings;
}

export async function createStory(input: { title: string; description?: string | null }) {
    const db = await readDatabase();
    const timestamp = nowIso();
    const story: StoryRecord = {
        id: randomUUID(),
        title: input.title.trim(),
        description: input.description?.trim() || null,
        createdAt: timestamp,
        updatedAt: timestamp,
    };
    db.stories.push(story);
    await writeDatabase(db);
    return story;
}

export async function updateStory(id: string, input: { title: string; description?: string | null }) {
    const db = await readDatabase();
    const story = db.stories.find((entry) => entry.id === id);
    if (!story) {
        throw new Error('Story not found');
    }

    story.title = input.title.trim();
    story.description = input.description?.trim() || null;
    story.updatedAt = nowIso();
    await writeDatabase(db);
    return story;
}

export async function deleteStory(id: string) {
    const db = await readDatabase();
    const storyNodeIds = new Set(db.nodes.filter((node) => node.storyId === id).map((node) => node.id));
    db.stories = db.stories.filter((story) => story.id !== id);
    db.nodes = db.nodes.filter((node) => node.storyId !== id);
    db.choices = db.choices.filter((choice) => !storyNodeIds.has(choice.nodeId) && !storyNodeIds.has(choice.targetNodeId ?? ''));
    await writeDatabase(db);
}

export async function listCharacters() {
    const db = await readDatabase();
    return db.characters
        .slice()
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
        .map((character) => hydrateCharacter(character, db));
}

export async function createCharacter(input: {
    name: string;
    spriteImageUrl?: string | null;
    sprites?: CharacterSpriteInput[];
}) {
    const db = await readDatabase();
    const timestamp = nowIso();
    const character: CharacterRecord = {
        id: randomUUID(),
        name: input.name.trim(),
        createdAt: timestamp,
        updatedAt: timestamp,
    };

    db.characters.push(character);
    db.characterSprites.push(...buildCharacterSpritesFromInput(character.id, input, [], timestamp));
    await writeDatabase(db);
    return hydrateCharacter(character, db);
}

export async function updateCharacter(id: string, input: {
    name: string;
    spriteImageUrl?: string | null;
    sprites?: CharacterSpriteInput[];
}) {
    const db = await readDatabase();
    const character = db.characters.find((entry) => entry.id === id);
    if (!character) {
        throw new Error('Character not found');
    }

    const timestamp = nowIso();
    character.name = input.name.trim();
    character.updatedAt = timestamp;

    const existingSprites = listSpritesForCharacter(character.id, db);
    const nextSprites = buildCharacterSpritesFromInput(character.id, input, existingSprites, timestamp);
    db.characterSprites = db.characterSprites.filter((sprite) => sprite.characterId !== character.id);
    db.characterSprites.push(...nextSprites);

    const validSpriteIds = new Set(nextSprites.map((sprite) => sprite.id));
    db.nodes = db.nodes.map((node) => {
        if (node.characterId !== character.id) {
            return node;
        }
        if (!node.characterSpriteId || validSpriteIds.has(node.characterSpriteId)) {
            return node;
        }
        return {
            ...node,
            characterSpriteId: null,
            updatedAt: timestamp,
        };
    });

    await writeDatabase(db);
    return hydrateCharacter(character, db);
}

export async function deleteCharacter(id: string) {
    const db = await readDatabase();
    const timestamp = nowIso();
    db.characters = db.characters.filter((character) => character.id !== id);
    db.characterSprites = db.characterSprites.filter((sprite) => sprite.characterId !== id);
    db.nodes = db.nodes.map((node) => (
        node.characterId === id
            ? {
                ...node,
                characterId: null,
                characterSpriteId: null,
                updatedAt: timestamp,
            }
            : node
    ));
    await writeDatabase(db);
}

export async function listBackgrounds() {
    const db = await readDatabase();
    return db.backgrounds
        .slice()
        .sort(compareBackgrounds);
}

export async function createBackground(input: { name: string; imageUrl: string }) {
    const db = await readDatabase();
    const timestamp = nowIso();
    const background: BackgroundRecord = {
        id: randomUUID(),
        name: input.name.trim(),
        imageUrl: input.imageUrl.trim(),
        createdAt: timestamp,
        updatedAt: timestamp,
    };

    db.backgrounds.push(background);
    await writeDatabase(db);
    return background;
}

export async function updateBackground(id: string, input: { name: string; imageUrl: string }) {
    const db = await readDatabase();
    const background = db.backgrounds.find((entry) => entry.id === id);
    if (!background) {
        throw new Error('Background not found');
    }

    background.name = input.name.trim();
    background.imageUrl = input.imageUrl.trim();
    background.updatedAt = nowIso();
    await writeDatabase(db);
    return background;
}

export async function deleteBackground(id: string) {
    const db = await readDatabase();
    const timestamp = nowIso();
    db.backgrounds = db.backgrounds.filter((background) => background.id !== id);
    db.nodes = db.nodes.map((node) => (
        node.backgroundId === id
            ? {
                ...node,
                backgroundId: null,
                updatedAt: timestamp,
            }
            : node
    ));
    await writeDatabase(db);
}

export async function listNodes(storyId?: string) {
    const db = await readDatabase();
    return db.nodes
        .filter((node) => !storyId || node.storyId === storyId)
        .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
        .map((node) => hydrateNode(node, db));
}

export async function createNode(input: {
    storyId: string;
    characterId?: string | null;
    characterSpriteId?: string | null;
    backgroundId?: string | null;
    backgroundImageUrl?: string | null;
    editorDepth?: number | null;
    editorOrder?: number | null;
    text: string;
    audioUrl?: string | null;
    isStartNode?: boolean;
    isEndNode?: boolean;
}) {
    const db = await readDatabase();
    const timestamp = nowIso();

    if (input.isStartNode) {
        db.nodes = db.nodes.map((node) => (
            node.storyId === input.storyId
                ? { ...node, isStartNode: false, updatedAt: timestamp }
                : node
        ));
    }

    const characterSelection = normalizeCharacterSelection(db, input);
    const layout = getNextLayoutDefaults(db, input.storyId, input);
    const node: NodeRecord = {
        id: randomUUID(),
        storyId: input.storyId,
        characterId: characterSelection.characterId,
        characterSpriteId: characterSelection.characterSpriteId,
        backgroundId: normalizeBackgroundSelection(db, input, timestamp),
        editorDepth: layout.editorDepth,
        editorOrder: layout.editorOrder,
        text: input.text.trim(),
        audioUrl: input.audioUrl?.trim() || null,
        isStartNode: Boolean(input.isStartNode),
        isEndNode: Boolean(input.isEndNode),
        createdAt: timestamp,
        updatedAt: timestamp,
    };

    for (const entry of db.nodes) {
        if (entry.storyId === input.storyId && entry.editorDepth === node.editorDepth && entry.editorOrder >= node.editorOrder) {
            entry.editorOrder += 1;
        }
    }

    db.nodes.push(node);
    reindexStoryLayout(db, input.storyId);
    await writeDatabase(db);
    return hydrateNode(node, db);
}

export async function updateNode(id: string, input: {
    characterId?: string | null;
    characterSpriteId?: string | null;
    backgroundId?: string | null;
    backgroundImageUrl?: string | null;
    editorDepth?: number | null;
    editorOrder?: number | null;
    text: string;
    audioUrl?: string | null;
    isStartNode?: boolean;
    isEndNode?: boolean;
}) {
    const db = await readDatabase();
    const node = db.nodes.find((entry) => entry.id === id);
    if (!node) {
        throw new Error('Node not found');
    }

    const timestamp = nowIso();
    if (input.isStartNode) {
        db.nodes = db.nodes.map((entry) => (
            entry.storyId === node.storyId && entry.id !== id
                ? { ...entry, isStartNode: false, updatedAt: timestamp }
                : entry
        ));
    }

    const updatedNode = db.nodes.find((entry) => entry.id === id);
    if (!updatedNode) {
        throw new Error('Node not found');
    }

    const characterSelection = normalizeCharacterSelection(db, input);
    updatedNode.characterId = characterSelection.characterId;
    updatedNode.characterSpriteId = characterSelection.characterSpriteId;
    updatedNode.backgroundId = normalizeBackgroundSelection(db, input, timestamp);
    applyNodeLayoutUpdate(db, updatedNode, input, timestamp);
    updatedNode.text = input.text.trim();
    updatedNode.audioUrl = input.audioUrl?.trim() || null;
    updatedNode.isStartNode = Boolean(input.isStartNode);
    updatedNode.isEndNode = Boolean(input.isEndNode);
    updatedNode.updatedAt = timestamp;

    await writeDatabase(db);
    return hydrateNode(updatedNode, db);
}

export async function updateNodeLayout(id: string, input: {
    editorDepth?: number | null;
    editorOrder?: number | null;
}) {
    const db = await readDatabase();
    const node = db.nodes.find((entry) => entry.id === id);
    if (!node) {
        throw new Error('Node not found');
    }

    const timestamp = nowIso();
    applyNodeLayoutUpdate(db, node, input, timestamp);
    await writeDatabase(db);
    return hydrateNode(node, db);
}

export async function deleteNode(id: string) {
    const db = await readDatabase();
    const node = db.nodes.find((entry) => entry.id === id);
    db.nodes = db.nodes.filter((entry) => entry.id !== id);
    db.choices = db.choices
        .filter((choice) => choice.nodeId !== id)
        .map((choice) => (
            choice.targetNodeId === id
                ? { ...choice, targetNodeId: null, updatedAt: nowIso() }
                : choice
        ));
    if (node) {
        reindexStoryLayout(db, node.storyId);
    }
    await writeDatabase(db);
}

export async function createChoice(input: {
    nodeId: string;
    targetNodeId?: string | null;
    text: string;
    scoreImpact?: number;
}) {
    const db = await readDatabase();
    const timestamp = nowIso();
    const choice: ChoiceRecord = {
        id: randomUUID(),
        nodeId: input.nodeId,
        targetNodeId: input.targetNodeId || null,
        text: input.text.trim(),
        scoreImpact: Number(input.scoreImpact ?? 0),
        createdAt: timestamp,
        updatedAt: timestamp,
    };

    db.choices.push(choice);
    await writeDatabase(db);
    return choice;
}

export async function updateChoice(id: string, input: {
    targetNodeId?: string | null;
    text: string;
    scoreImpact?: number;
}) {
    const db = await readDatabase();
    const choice = db.choices.find((entry) => entry.id === id);
    if (!choice) {
        throw new Error('Choice not found');
    }

    choice.text = input.text.trim();
    choice.targetNodeId = input.targetNodeId || null;
    choice.scoreImpact = Number(input.scoreImpact ?? 0);
    choice.updatedAt = nowIso();
    await writeDatabase(db);
    return choice;
}

export async function deleteChoice(id: string) {
    const db = await readDatabase();
    db.choices = db.choices.filter((choice) => choice.id !== id);
    await writeDatabase(db);
}

export async function listLeaderboard() {
    const db = await readDatabase();
    return db.playerScores
        .slice()
        .sort((left, right) => right.score - left.score || left.createdAt.localeCompare(right.createdAt))
        .slice(0, 50);
}

export async function createPlayerScore(input: { name?: string | null; score?: number }) {
    const db = await readDatabase();
    const score: PlayerScoreRecord = {
        id: randomUUID(),
        name: input.name?.trim() || 'Anonymous Voter',
        score: Number(input.score ?? 0),
        createdAt: nowIso(),
    };
    db.playerScores.push(score);
    await writeDatabase(db);
    return score;
}

export async function updatePlayerScore(id: string, input: { name?: string | null; score?: number }) {
    const db = await readDatabase();
    const score = db.playerScores.find((entry) => entry.id === id);
    if (!score) {
        throw new Error('Leaderboard entry not found');
    }

    score.name = input.name?.trim() || 'Anonymous Voter';
    score.score = Number(input.score ?? 0);
    await writeDatabase(db);
    return score;
}

export async function deletePlayerScore(id: string) {
    const db = await readDatabase();
    db.playerScores = db.playerScores.filter((entry) => entry.id !== id);
    await writeDatabase(db);
}

export async function writeSeedData() {
    const seeded = seedDatabase();
    await writeDatabase(seeded);
    return seeded;
}
