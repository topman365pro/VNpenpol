import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { deriveAssetLabel } from '@/lib/asset-utils';

export interface StoryRecord {
    id: string;
    title: string;
    description: string | null;
    defaultMusicTrackId: string | null;
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

export interface MusicTrackRecord {
    id: string;
    name: string;
    audioUrl: string;
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
    musicTrackId: string | null;
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
    musicTrack: MusicTrackRecord | null;
    musicTrackAudioUrl: string | null;
    choices: ChoiceRecord[];
}

export interface HydratedStoryRecord extends StoryRecord {
    defaultMusicTrack: MusicTrackRecord | null;
}

type DBClient = typeof prisma | Prisma.TransactionClient;

type LegacyCharacterRecord = CharacterRecord & {
    spriteImageUrl?: string | null;
};

type LegacyNodeRecord = Omit<NodeRecord, 'characterSpriteId' | 'backgroundId' | 'musicTrackId'> & {
    characterSpriteId?: string | null;
    backgroundId?: string | null;
    musicTrackId?: string | null;
    backgroundImageUrl?: string | null;
};

type LegacyDatabaseShape = {
    stories?: Array<Omit<StoryRecord, 'defaultMusicTrackId'> & { defaultMusicTrackId?: string | null }>;
    characters?: LegacyCharacterRecord[];
    characterSprites?: CharacterSpriteRecord[];
    backgrounds?: BackgroundRecord[];
    musicTracks?: MusicTrackRecord[];
    nodes?: LegacyNodeRecord[];
    choices?: ChoiceRecord[];
    playerScores?: PlayerScoreRecord[];
    siteSettings?: Partial<SiteSettingsRecord>;
};

interface CharacterSpriteInput {
    id?: string | null;
    label?: string | null;
    imageUrl?: string | null;
    isDefault?: boolean;
    sortOrder?: number;
}

const dataFile = path.join(process.cwd(), 'data', 'db.json');

let bootstrapPromise: Promise<void> | null = null;

const characterInclude = {
    sprites: {
        orderBy: [
            { sortOrder: 'asc' },
            { createdAt: 'asc' },
        ],
    },
} satisfies Prisma.CharacterInclude;

const nodeInclude = {
    character: {
        include: characterInclude,
    },
    characterSprite: true,
    background: true,
    musicTrack: true,
    choices: {
        orderBy: {
            createdAt: 'asc',
        },
    },
} satisfies Prisma.NodeInclude;

function nowDate() {
    return new Date();
}

function nowIso() {
    return nowDate().toISOString();
}

function normalizePublicLocale(locale: string | null | undefined): 'id' | 'en' {
    return locale === 'en' ? 'en' : 'id';
}

function toIsoString(value: Date | string) {
    return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapStory(story: {
    id: string;
    title: string;
    description: string | null;
    defaultMusicTrackId: string | null;
    createdAt: Date;
    updatedAt: Date;
}) {
    return {
        id: story.id,
        title: story.title,
        description: story.description,
        defaultMusicTrackId: story.defaultMusicTrackId,
        createdAt: toIsoString(story.createdAt),
        updatedAt: toIsoString(story.updatedAt),
    };
}

function mapBackground(background: {
    id: string;
    name: string;
    imageUrl: string;
    createdAt: Date;
    updatedAt: Date;
}): BackgroundRecord {
    return {
        id: background.id,
        name: background.name,
        imageUrl: background.imageUrl,
        createdAt: toIsoString(background.createdAt),
        updatedAt: toIsoString(background.updatedAt),
    };
}

function mapMusicTrack(track: {
    id: string;
    name: string;
    audioUrl: string;
    createdAt: Date;
    updatedAt: Date;
}): MusicTrackRecord {
    return {
        id: track.id,
        name: track.name,
        audioUrl: track.audioUrl,
        createdAt: toIsoString(track.createdAt),
        updatedAt: toIsoString(track.updatedAt),
    };
}

function mapCharacterSprite(sprite: {
    id: string;
    characterId: string;
    label: string;
    imageUrl: string;
    isDefault: boolean;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
}): CharacterSpriteRecord {
    return {
        id: sprite.id,
        characterId: sprite.characterId,
        label: sprite.label,
        imageUrl: sprite.imageUrl,
        isDefault: sprite.isDefault,
        sortOrder: sprite.sortOrder,
        createdAt: toIsoString(sprite.createdAt),
        updatedAt: toIsoString(sprite.updatedAt),
    };
}

function mapChoice(choice: {
    id: string;
    nodeId: string;
    targetNodeId: string | null;
    text: string;
    scoreImpact: number;
    createdAt: Date;
    updatedAt: Date;
}): ChoiceRecord {
    return {
        id: choice.id,
        nodeId: choice.nodeId,
        targetNodeId: choice.targetNodeId,
        text: choice.text,
        scoreImpact: choice.scoreImpact,
        createdAt: toIsoString(choice.createdAt),
        updatedAt: toIsoString(choice.updatedAt),
    };
}

function mapPlayerScore(score: {
    id: string;
    name: string;
    score: number;
    createdAt: Date;
}): PlayerScoreRecord {
    return {
        id: score.id,
        name: score.name,
        score: score.score,
        createdAt: toIsoString(score.createdAt),
    };
}

function mapNode(node: {
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
    createdAt: Date;
    updatedAt: Date;
}): NodeRecord {
    return {
        id: node.id,
        storyId: node.storyId,
        characterId: node.characterId,
        characterSpriteId: node.characterSpriteId,
        backgroundId: node.backgroundId,
        musicTrackId: node.musicTrackId,
        editorDepth: node.editorDepth,
        editorOrder: node.editorOrder,
        text: node.text,
        audioUrl: node.audioUrl,
        isStartNode: node.isStartNode,
        isEndNode: node.isEndNode,
        createdAt: toIsoString(node.createdAt),
        updatedAt: toIsoString(node.updatedAt),
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

function compareMusicTracks(left: MusicTrackRecord, right: MusicTrackRecord) {
    return right.createdAt.localeCompare(left.createdAt)
        || left.name.localeCompare(right.name);
}

function compareNodeLayout(left: NodeRecord, right: NodeRecord) {
    return left.editorDepth - right.editorDepth
        || left.editorOrder - right.editorOrder
        || left.createdAt.localeCompare(right.createdAt)
        || left.id.localeCompare(right.id);
}

function clampEditorDepth(value: number, isStartNode: boolean) {
    if (isStartNode) {
        return 0;
    }
    return Math.max(0, value);
}

function listSpritesForCharacter(characterId: string, sprites: CharacterSpriteRecord[]) {
    return sprites
        .filter((sprite) => sprite.characterId === characterId)
        .slice()
        .sort(compareSprites);
}

function hydrateCharacter(character: CharacterRecord, sprites: CharacterSpriteRecord[]): CharacterWithSprites {
    const characterSprites = listSpritesForCharacter(character.id, sprites);
    return {
        id: character.id,
        name: character.name,
        createdAt: character.createdAt,
        updatedAt: character.updatedAt,
        sprites: characterSprites,
        defaultSprite: characterSprites.find((sprite) => sprite.isDefault) ?? characterSprites[0] ?? null,
    };
}

function normalizeSpriteDrafts(drafts: CharacterSpriteInput[]) {
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

function reindexStoryLayout(nodes: NodeRecord[], storyId: string) {
    const storyNodes = nodes
        .filter((node) => node.storyId === storyId)
        .slice()
        .sort(compareNodeLayout);

    const orderByDepth = new Map<number, number>();
    for (const node of storyNodes) {
        node.editorDepth = clampEditorDepth(node.editorDepth, node.isStartNode);
        const nextOrder = orderByDepth.get(node.editorDepth) ?? 0;
        node.editorOrder = nextOrder;
        orderByDepth.set(node.editorDepth, nextOrder + 1);
    }
}

function getNextLayoutDefaults(
    storyNodes: NodeRecord[],
    storyId: string,
    input: { editorDepth?: number | null; editorOrder?: number | null; isStartNode?: boolean }
) {
    const existingNodes = storyNodes.filter((node) => node.storyId === storyId);
    const explicitDepth = typeof input.editorDepth === 'number' && Number.isFinite(input.editorDepth)
        ? Math.floor(input.editorDepth)
        : null;
    const maxExistingDepth = existingNodes.length > 0
        ? Math.max(...existingNodes.map((node) => node.editorDepth), 0)
        : -1;
    const editorDepth = clampEditorDepth(explicitDepth ?? maxExistingDepth + 1, Boolean(input.isStartNode));
    const laneNodes = existingNodes
        .filter((node) => node.editorDepth === editorDepth)
        .slice()
        .sort(compareNodeLayout);
    const explicitOrder = typeof input.editorOrder === 'number' && Number.isFinite(input.editorOrder)
        ? Math.floor(input.editorOrder)
        : laneNodes.length;
    const editorOrder = Math.max(0, Math.min(explicitOrder, laneNodes.length));

    return { editorDepth, editorOrder };
}

async function readLegacyDatabase(): Promise<LegacyDatabaseShape | null> {
    try {
        const raw = await readFile(dataFile, 'utf8');
        return JSON.parse(raw) as LegacyDatabaseShape;
    } catch {
        return null;
    }
}

async function ensureBootstrap() {
    if (!bootstrapPromise) {
        bootstrapPromise = bootstrapDatabase();
    }
    await bootstrapPromise;
}

async function bootstrapDatabase() {
    const storyCount = await prisma.story.count();
    if (storyCount > 0) {
        await prisma.siteSettings.upsert({
            where: { id: 'global' },
            update: {},
            create: {
                id: 'global',
                publicLocale: 'id',
            },
        });
        return;
    }

    const legacy = await readLegacyDatabase();
    if (!legacy) {
        await prisma.siteSettings.upsert({
            where: { id: 'global' },
            update: {},
            create: {
                id: 'global',
                publicLocale: 'id',
            },
        });
        return;
    }

    const timestamp = nowIso();
    const stories = Array.isArray(legacy.stories) ? legacy.stories : [];
    const characters = Array.isArray(legacy.characters) ? legacy.characters.map((character) => ({
        id: character.id,
        name: character.name,
        createdAt: new Date(character.createdAt || timestamp),
        updatedAt: new Date(character.updatedAt || character.createdAt || timestamp),
    })) : [];
    const characterSprites = Array.isArray(legacy.characterSprites) ? legacy.characterSprites.map((sprite) => ({
        id: sprite.id,
        characterId: sprite.characterId,
        label: sprite.label,
        imageUrl: sprite.imageUrl,
        isDefault: Boolean(sprite.isDefault),
        sortOrder: Number.isFinite(sprite.sortOrder) ? Number(sprite.sortOrder) : 0,
        createdAt: new Date(sprite.createdAt || timestamp),
        updatedAt: new Date(sprite.updatedAt || sprite.createdAt || timestamp),
    })) : [];
    const backgrounds = Array.isArray(legacy.backgrounds) ? legacy.backgrounds.map((background) => ({
        id: background.id,
        name: background.name || deriveAssetLabel(background.imageUrl, 'Background'),
        imageUrl: background.imageUrl,
        createdAt: new Date(background.createdAt || timestamp),
        updatedAt: new Date(background.updatedAt || background.createdAt || timestamp),
    })) : [];
    const musicTracks = Array.isArray(legacy.musicTracks) ? legacy.musicTracks.map((track) => ({
        id: track.id,
        name: track.name || deriveAssetLabel(track.audioUrl, 'Music Track'),
        audioUrl: track.audioUrl,
        createdAt: new Date(track.createdAt || timestamp),
        updatedAt: new Date(track.updatedAt || track.createdAt || timestamp),
    })) : [];
    const musicTrackIds = new Set(musicTracks.map((track) => track.id));
    const nodes = Array.isArray(legacy.nodes) ? legacy.nodes.map((node) => ({
        id: node.id,
        storyId: node.storyId,
        characterId: node.characterId?.trim() || null,
        characterSpriteId: node.characterSpriteId?.trim() || null,
        backgroundId: node.backgroundId?.trim() || null,
        musicTrackId: node.musicTrackId?.trim() || null,
        editorDepth: Number.isFinite(node.editorDepth) ? Number(node.editorDepth) : 0,
        editorOrder: Number.isFinite(node.editorOrder) ? Number(node.editorOrder) : 0,
        text: node.text,
        audioUrl: node.audioUrl?.trim() || null,
        isStartNode: Boolean(node.isStartNode),
        isEndNode: Boolean(node.isEndNode),
        createdAt: new Date(node.createdAt || timestamp),
        updatedAt: new Date(node.updatedAt || node.createdAt || timestamp),
    })) : [];
    const choices = Array.isArray(legacy.choices) ? legacy.choices.map((choice) => ({
        id: choice.id,
        nodeId: choice.nodeId,
        targetNodeId: choice.targetNodeId ?? null,
        text: choice.text,
        scoreImpact: Number(choice.scoreImpact ?? 0),
        createdAt: new Date(choice.createdAt || timestamp),
        updatedAt: new Date(choice.updatedAt || choice.createdAt || timestamp),
    })) : [];
    const playerScores = Array.isArray(legacy.playerScores) ? legacy.playerScores.map((score) => ({
        id: score.id,
        name: score.name,
        score: Number(score.score ?? 0),
        createdAt: new Date(score.createdAt || timestamp),
    })) : [];

    await prisma.$transaction(async (tx) => {
        if (musicTracks.length > 0) {
            await tx.musicTrack.createMany({ data: musicTracks });
        }

        if (stories.length > 0) {
            await tx.story.createMany({
                data: stories.map((story) => ({
                    id: story.id,
                    title: story.title,
                    description: story.description,
                    defaultMusicTrackId: story.defaultMusicTrackId && musicTrackIds.has(story.defaultMusicTrackId)
                        ? story.defaultMusicTrackId
                        : null,
                    createdAt: new Date(story.createdAt || timestamp),
                    updatedAt: new Date(story.updatedAt || story.createdAt || timestamp),
                })),
            });
        }

        if (characters.length > 0) {
            await tx.character.createMany({ data: characters });
        }

        if (characterSprites.length > 0) {
            await tx.characterSprite.createMany({ data: characterSprites });
        }

        if (backgrounds.length > 0) {
            await tx.background.createMany({ data: backgrounds });
        }

        await tx.siteSettings.create({
            data: {
                id: 'global',
                publicLocale: normalizePublicLocale(legacy.siteSettings?.publicLocale),
            },
        });

        if (nodes.length > 0) {
            await tx.node.createMany({
                data: nodes.map((node) => ({
                    ...node,
                    musicTrackId: node.musicTrackId && musicTrackIds.has(node.musicTrackId)
                        ? node.musicTrackId
                        : null,
                })),
            });
        }

        if (choices.length > 0) {
            await tx.choice.createMany({ data: choices });
        }

        if (playerScores.length > 0) {
            await tx.playerScore.createMany({ data: playerScores });
        }
    });
}

async function ensureSiteSettings() {
    await prisma.siteSettings.upsert({
        where: { id: 'global' },
        update: {},
        create: {
            id: 'global',
            publicLocale: 'id',
        },
    });
}

async function getCharacterSprites(characterId: string) {
    const sprites = await prisma.characterSprite.findMany({
        where: { characterId },
        orderBy: [
            { sortOrder: 'asc' },
            { createdAt: 'asc' },
        ],
    });
    return sprites.map(mapCharacterSprite);
}

async function resolveCharacterSelection(
    db: DBClient,
    input: { characterId?: string | null; characterSpriteId?: string | null }
) {
    const characterId = input.characterId?.trim() || null;
    if (!characterId) {
        return {
            characterId: null,
            characterSpriteId: null,
        };
    }

    const character = await db.character.findUnique({
        where: { id: characterId },
        include: characterInclude,
    });
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

    const sprite = character.sprites.find((entry) => entry.id === characterSpriteId);
    return {
        characterId,
        characterSpriteId: sprite ? characterSpriteId : null,
    };
}

async function resolveBackgroundSelection(
    db: DBClient,
    input: { backgroundId?: string | null; backgroundImageUrl?: string | null }
) {
    const backgroundId = input.backgroundId?.trim() || null;
    if (backgroundId) {
        const background = await db.background.findUnique({ where: { id: backgroundId } });
        if (background) {
            return background.id;
        }
    }

    const backgroundImageUrl = input.backgroundImageUrl?.trim() || '';
    if (!backgroundImageUrl) {
        return null;
    }

    const existing = await db.background.findFirst({
        where: { imageUrl: backgroundImageUrl },
    });
    if (existing) {
        return existing.id;
    }

    const created = await db.background.create({
        data: {
            id: randomUUID(),
            name: deriveAssetLabel(backgroundImageUrl, 'Background'),
            imageUrl: backgroundImageUrl,
        },
    });

    return created.id;
}

async function resolveMusicTrackSelection(
    db: DBClient,
    input: { musicTrackId?: string | null; defaultMusicTrackId?: string | null }
) {
    const musicTrackId = input.musicTrackId?.trim() || input.defaultMusicTrackId?.trim() || null;
    if (!musicTrackId) {
        return null;
    }

    const musicTrack = await db.musicTrack.findUnique({
        where: { id: musicTrackId },
        select: { id: true },
    });

    return musicTrack?.id ?? null;
}

function buildCreateLayoutNodes(
    storyNodes: NodeRecord[],
    node: Omit<NodeRecord, 'createdAt' | 'updatedAt'>
) {
    const nextNodes = storyNodes.map((entry) => ({ ...entry }));

    if (node.isStartNode) {
        nextNodes.forEach((entry) => {
            entry.isStartNode = false;
        });
    }

    for (const entry of nextNodes) {
        if (entry.editorDepth === node.editorDepth && entry.editorOrder >= node.editorOrder) {
            entry.editorOrder += 1;
        }
    }

    nextNodes.push({
        ...node,
        createdAt: '',
        updatedAt: '',
    });
    reindexStoryLayout(nextNodes, node.storyId);
    return nextNodes;
}

function buildUpdatedLayoutNodes(
    storyNodes: NodeRecord[],
    nodeId: string,
    input: {
        editorDepth?: number | null;
        editorOrder?: number | null;
        isStartNode?: boolean;
    }
) {
    const existing = storyNodes.find((entry) => entry.id === nodeId);
    if (!existing) {
        throw new Error('Node not found');
    }

    const remaining = storyNodes
        .filter((entry) => entry.id !== nodeId)
        .map((entry) => ({ ...entry }));

    const nextIsStartNode = typeof input.isStartNode === 'boolean' ? input.isStartNode : existing.isStartNode;
    if (nextIsStartNode) {
        remaining.forEach((entry) => {
            entry.isStartNode = false;
        });
    }

    const editorDepth = clampEditorDepth(
        typeof input.editorDepth === 'number' && Number.isFinite(input.editorDepth)
            ? Math.floor(input.editorDepth)
            : existing.editorDepth,
        nextIsStartNode
    );
    const laneNodes = remaining
        .filter((entry) => entry.editorDepth === editorDepth)
        .slice()
        .sort(compareNodeLayout);
    const editorOrder = Math.max(
        0,
        Math.min(
            typeof input.editorOrder === 'number' && Number.isFinite(input.editorOrder)
                ? Math.floor(input.editorOrder)
                : existing.editorOrder,
            laneNodes.length
        )
    );

    for (const entry of remaining) {
        if (entry.editorDepth === editorDepth && entry.editorOrder >= editorOrder) {
            entry.editorOrder += 1;
        }
    }

    remaining.push({
        ...existing,
        editorDepth,
        editorOrder,
        isStartNode: nextIsStartNode,
        createdAt: existing.createdAt,
        updatedAt: existing.updatedAt,
    });

    reindexStoryLayout(remaining, existing.storyId);
    return remaining;
}

async function hydrateNodeById(id: string) {
    const node = await prisma.node.findUnique({
        where: { id },
        include: nodeInclude,
    });
    if (!node) {
        throw new Error('Node not found');
    }

    const mappedCharacter = node.character
        ? hydrateCharacter(
            {
                id: node.character.id,
                name: node.character.name,
                createdAt: toIsoString(node.character.createdAt),
                updatedAt: toIsoString(node.character.updatedAt),
            },
            node.character.sprites.map(mapCharacterSprite)
        )
        : null;
    const characterSprite = mappedCharacter
        ? mappedCharacter.sprites.find((sprite) => sprite.id === node.characterSpriteId) ?? mappedCharacter.defaultSprite
        : null;
    const background = node.background ? mapBackground(node.background) : null;
    const musicTrack = node.musicTrack ? mapMusicTrack(node.musicTrack) : null;

    return {
        ...mapNode(node),
        character: mappedCharacter,
        characterSprite,
        spriteImageUrl: characterSprite?.imageUrl ?? null,
        background,
        backgroundImageUrl: background?.imageUrl ?? null,
        musicTrack,
        musicTrackAudioUrl: musicTrack?.audioUrl ?? null,
        choices: node.choices.map(mapChoice),
    } satisfies HydratedNodeRecord;
}

async function hydrateStoryById(id: string) {
    const story = await prisma.story.findUnique({
        where: { id },
        include: {
            defaultMusicTrack: true,
        },
    });
    if (!story) {
        throw new Error('Story not found');
    }

    const defaultMusicTrack = story.defaultMusicTrack ? mapMusicTrack(story.defaultMusicTrack) : null;

    return {
        ...mapStory(story),
        defaultMusicTrack,
    } satisfies HydratedStoryRecord;
}

async function syncCharacterSprites(
    tx: Prisma.TransactionClient,
    characterId: string,
    input: { spriteImageUrl?: string | null; sprites?: CharacterSpriteInput[] }
) {
    const timestamp = nowIso();
    const existingSprites = await getCharacterSprites(characterId);
    const nextSprites = buildCharacterSpritesFromInput(characterId, input, existingSprites, timestamp);
    const nextById = new Map(nextSprites.map((sprite) => [sprite.id, sprite]));
    const existingIds = new Set(existingSprites.map((sprite) => sprite.id));
    const removedIds = existingSprites
        .map((sprite) => sprite.id)
        .filter((id) => !nextById.has(id));

    if (removedIds.length > 0) {
        await tx.node.updateMany({
            where: {
                characterId,
                characterSpriteId: {
                    in: removedIds,
                },
            },
            data: {
                characterSpriteId: null,
                updatedAt: nowDate(),
            },
        });

        await tx.characterSprite.deleteMany({
            where: {
                id: {
                    in: removedIds,
                },
            },
        });
    }

    for (const sprite of nextSprites) {
        if (existingIds.has(sprite.id)) {
            await tx.characterSprite.update({
                where: { id: sprite.id },
                data: {
                    label: sprite.label,
                    imageUrl: sprite.imageUrl,
                    isDefault: sprite.isDefault,
                    sortOrder: sprite.sortOrder,
                    updatedAt: new Date(sprite.updatedAt),
                },
            });
        } else {
            await tx.characterSprite.create({
                data: {
                    id: sprite.id,
                    characterId,
                    label: sprite.label,
                    imageUrl: sprite.imageUrl,
                    isDefault: sprite.isDefault,
                    sortOrder: sprite.sortOrder,
                    createdAt: new Date(sprite.createdAt),
                    updatedAt: new Date(sprite.updatedAt),
                },
            });
        }
    }
}

export async function listStories() {
    await ensureBootstrap();
    const stories = await prisma.story.findMany({
        include: {
            defaultMusicTrack: true,
            nodes: {
                select: {
                    id: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    return stories.map((story) => ({
        ...mapStory(story),
        defaultMusicTrack: story.defaultMusicTrack ? mapMusicTrack(story.defaultMusicTrack) : null,
        nodes: story.nodes,
    }));
}

export async function getStory(id: string) {
    await ensureBootstrap();
    return hydrateStoryById(id);
}

export async function getSiteSettings() {
    await ensureBootstrap();
    await ensureSiteSettings();
    const settings = await prisma.siteSettings.findUnique({
        where: { id: 'global' },
    });

    return {
        publicLocale: normalizePublicLocale(settings?.publicLocale),
    } satisfies SiteSettingsRecord;
}

export async function updateSiteSettings(input: Partial<SiteSettingsRecord>) {
    await ensureBootstrap();
    const settings = await prisma.siteSettings.upsert({
        where: { id: 'global' },
        update: {
            publicLocale: normalizePublicLocale(input.publicLocale),
        },
        create: {
            id: 'global',
            publicLocale: normalizePublicLocale(input.publicLocale),
        },
    });

    return {
        publicLocale: normalizePublicLocale(settings.publicLocale),
    } satisfies SiteSettingsRecord;
}

export async function createStory(input: { title: string; description?: string | null; defaultMusicTrackId?: string | null }) {
    await ensureBootstrap();
    const story = await prisma.$transaction(async (tx) => {
        const defaultMusicTrackId = await resolveMusicTrackSelection(tx, input);
        return tx.story.create({
            data: {
                id: randomUUID(),
                title: input.title.trim(),
                description: input.description?.trim() || null,
                defaultMusicTrackId,
            },
        });
    });

    return hydrateStoryById(story.id);
}

export async function updateStory(id: string, input: { title: string; description?: string | null; defaultMusicTrackId?: string | null }) {
    await ensureBootstrap();
    await prisma.$transaction(async (tx) => {
        const defaultMusicTrackId = await resolveMusicTrackSelection(tx, input);
        await tx.story.update({
            where: { id },
            data: {
                title: input.title.trim(),
                description: input.description?.trim() || null,
                defaultMusicTrackId,
            },
        });
    });

    return hydrateStoryById(id);
}

export async function deleteStory(id: string) {
    await ensureBootstrap();
    await prisma.story.delete({
        where: { id },
    });
}

export async function listCharacters() {
    await ensureBootstrap();
    const characters = await prisma.character.findMany({
        include: characterInclude,
        orderBy: {
            createdAt: 'desc',
        },
    });

    return characters.map((character) => hydrateCharacter(
        {
            id: character.id,
            name: character.name,
            createdAt: toIsoString(character.createdAt),
            updatedAt: toIsoString(character.updatedAt),
        },
        character.sprites.map(mapCharacterSprite)
    ));
}

export async function createCharacter(input: {
    name: string;
    spriteImageUrl?: string | null;
    sprites?: CharacterSpriteInput[];
}) {
    await ensureBootstrap();
    const character = await prisma.$transaction(async (tx) => {
        const created = await tx.character.create({
            data: {
                id: randomUUID(),
                name: input.name.trim(),
            },
        });

        await syncCharacterSprites(tx, created.id, input);
        return created;
    });

    const createdCharacter = await prisma.character.findUnique({
        where: { id: character.id },
        include: characterInclude,
    });
    if (!createdCharacter) {
        throw new Error('Character not found');
    }

    return hydrateCharacter(
        {
            id: createdCharacter.id,
            name: createdCharacter.name,
            createdAt: toIsoString(createdCharacter.createdAt),
            updatedAt: toIsoString(createdCharacter.updatedAt),
        },
        createdCharacter.sprites.map(mapCharacterSprite)
    );
}

export async function updateCharacter(id: string, input: {
    name: string;
    spriteImageUrl?: string | null;
    sprites?: CharacterSpriteInput[];
}) {
    await ensureBootstrap();
    await prisma.$transaction(async (tx) => {
        await tx.character.update({
            where: { id },
            data: {
                name: input.name.trim(),
            },
        });

        await syncCharacterSprites(tx, id, input);
    });

    const character = await prisma.character.findUnique({
        where: { id },
        include: characterInclude,
    });
    if (!character) {
        throw new Error('Character not found');
    }

    return hydrateCharacter(
        {
            id: character.id,
            name: character.name,
            createdAt: toIsoString(character.createdAt),
            updatedAt: toIsoString(character.updatedAt),
        },
        character.sprites.map(mapCharacterSprite)
    );
}

export async function deleteCharacter(id: string) {
    await ensureBootstrap();
    await prisma.character.delete({
        where: { id },
    });
}

export async function listBackgrounds() {
    await ensureBootstrap();
    const backgrounds = await prisma.background.findMany({
        orderBy: [
            { createdAt: 'desc' },
            { name: 'asc' },
        ],
    });

    return backgrounds.map(mapBackground).sort(compareBackgrounds);
}

export async function listMusicTracks() {
    await ensureBootstrap();
    const musicTracks = await prisma.musicTrack.findMany({
        orderBy: [
            { createdAt: 'desc' },
            { name: 'asc' },
        ],
    });

    return musicTracks.map(mapMusicTrack).sort(compareMusicTracks);
}

export async function createMusicTrack(input: { name: string; audioUrl: string }) {
    await ensureBootstrap();
    const musicTrack = await prisma.musicTrack.create({
        data: {
            id: randomUUID(),
            name: input.name.trim(),
            audioUrl: input.audioUrl.trim(),
        },
    });
    return mapMusicTrack(musicTrack);
}

export async function updateMusicTrack(id: string, input: { name: string; audioUrl: string }) {
    await ensureBootstrap();
    const musicTrack = await prisma.musicTrack.update({
        where: { id },
        data: {
            name: input.name.trim(),
            audioUrl: input.audioUrl.trim(),
        },
    });
    return mapMusicTrack(musicTrack);
}

export async function deleteMusicTrack(id: string) {
    await ensureBootstrap();
    await prisma.$transaction(async (tx) => {
        const timestamp = nowDate();
        await tx.story.updateMany({
            where: { defaultMusicTrackId: id },
            data: {
                defaultMusicTrackId: null,
                updatedAt: timestamp,
            },
        });
        await tx.node.updateMany({
            where: { musicTrackId: id },
            data: {
                musicTrackId: null,
                updatedAt: timestamp,
            },
        });
        await tx.musicTrack.delete({
            where: { id },
        });
    });
}

export async function createBackground(input: { name: string; imageUrl: string }) {
    await ensureBootstrap();
    const background = await prisma.background.create({
        data: {
            id: randomUUID(),
            name: input.name.trim(),
            imageUrl: input.imageUrl.trim(),
        },
    });
    return mapBackground(background);
}

export async function updateBackground(id: string, input: { name: string; imageUrl: string }) {
    await ensureBootstrap();
    const background = await prisma.background.update({
        where: { id },
        data: {
            name: input.name.trim(),
            imageUrl: input.imageUrl.trim(),
        },
    });
    return mapBackground(background);
}

export async function deleteBackground(id: string) {
    await ensureBootstrap();
    await prisma.background.delete({
        where: { id },
    });
}

export async function listNodes(storyId?: string) {
    await ensureBootstrap();
    const nodes = await prisma.node.findMany({
        where: storyId ? { storyId } : undefined,
        include: nodeInclude,
        orderBy: {
            createdAt: 'asc',
        },
    });

    return nodes.map((node) => {
        const character = node.character
            ? hydrateCharacter(
                {
                    id: node.character.id,
                    name: node.character.name,
                    createdAt: toIsoString(node.character.createdAt),
                    updatedAt: toIsoString(node.character.updatedAt),
                },
                node.character.sprites.map(mapCharacterSprite)
            )
            : null;
        const characterSprite = character
            ? character.sprites.find((sprite) => sprite.id === node.characterSpriteId) ?? character.defaultSprite
            : null;
        const background = node.background ? mapBackground(node.background) : null;
        const musicTrack = node.musicTrack ? mapMusicTrack(node.musicTrack) : null;

        return {
            ...mapNode(node),
            character,
            characterSprite,
            spriteImageUrl: characterSprite?.imageUrl ?? null,
            background,
            backgroundImageUrl: background?.imageUrl ?? null,
            musicTrack,
            musicTrackAudioUrl: musicTrack?.audioUrl ?? null,
            choices: node.choices.map(mapChoice),
        } satisfies HydratedNodeRecord;
    });
}

export async function createNode(input: {
    storyId: string;
    characterId?: string | null;
    characterSpriteId?: string | null;
    backgroundId?: string | null;
    backgroundImageUrl?: string | null;
    musicTrackId?: string | null;
    editorDepth?: number | null;
    editorOrder?: number | null;
    text: string;
    audioUrl?: string | null;
    isStartNode?: boolean;
    isEndNode?: boolean;
}) {
    await ensureBootstrap();
    const timestamp = nowDate();
    const created = await prisma.$transaction(async (tx) => {
        const storyNodes = (await tx.node.findMany({
            where: { storyId: input.storyId },
            orderBy: [
                { editorDepth: 'asc' },
                { editorOrder: 'asc' },
                { createdAt: 'asc' },
            ],
        })).map(mapNode);
        const characterSelection = await resolveCharacterSelection(tx, input);
        const backgroundId = await resolveBackgroundSelection(tx, input);
        const musicTrackId = await resolveMusicTrackSelection(tx, input);
        const layout = getNextLayoutDefaults(storyNodes, input.storyId, input);
        const draftNode = {
            id: randomUUID(),
            storyId: input.storyId,
            characterId: characterSelection.characterId,
            characterSpriteId: characterSelection.characterSpriteId,
            backgroundId,
            musicTrackId,
            editorDepth: layout.editorDepth,
            editorOrder: layout.editorOrder,
            text: input.text.trim(),
            audioUrl: input.audioUrl?.trim() || null,
            isStartNode: Boolean(input.isStartNode),
            isEndNode: Boolean(input.isEndNode),
        };
        const nextLayout = buildCreateLayoutNodes(storyNodes, draftNode);
        const layoutById = new Map(nextLayout.map((node) => [node.id, node]));

        for (const existing of storyNodes) {
            const next = layoutById.get(existing.id);
            if (!next) {
                continue;
            }
            if (existing.editorDepth !== next.editorDepth || existing.editorOrder !== next.editorOrder || existing.isStartNode !== next.isStartNode) {
                await tx.node.update({
                    where: { id: existing.id },
                    data: {
                        editorDepth: next.editorDepth,
                        editorOrder: next.editorOrder,
                        isStartNode: next.isStartNode,
                        updatedAt: timestamp,
                    },
                });
            }
        }

        await tx.node.create({
            data: {
                ...draftNode,
                createdAt: timestamp,
                updatedAt: timestamp,
            },
        });

        return draftNode.id;
    });

    return hydrateNodeById(created);
}

export async function updateNode(id: string, input: {
    characterId?: string | null;
    characterSpriteId?: string | null;
    backgroundId?: string | null;
    backgroundImageUrl?: string | null;
    musicTrackId?: string | null;
    editorDepth?: number | null;
    editorOrder?: number | null;
    text: string;
    audioUrl?: string | null;
    isStartNode?: boolean;
    isEndNode?: boolean;
}) {
    await ensureBootstrap();
    await prisma.$transaction(async (tx) => {
        const current = await tx.node.findUnique({
            where: { id },
        });
        if (!current) {
            throw new Error('Node not found');
        }

        const storyNodes = (await tx.node.findMany({
            where: { storyId: current.storyId },
            orderBy: [
                { editorDepth: 'asc' },
                { editorOrder: 'asc' },
                { createdAt: 'asc' },
            ],
        })).map(mapNode);
        const characterSelection = await resolveCharacterSelection(tx, input);
        const backgroundId = await resolveBackgroundSelection(tx, input);
        const musicTrackId = await resolveMusicTrackSelection(tx, input);
        const nextLayout = buildUpdatedLayoutNodes(storyNodes, id, input);
        const layoutById = new Map(nextLayout.map((node) => [node.id, node]));
        const timestamp = nowDate();

        for (const existing of storyNodes) {
            const next = layoutById.get(existing.id);
            if (!next) {
                continue;
            }

            const isTarget = existing.id === id;
            await tx.node.update({
                where: { id: existing.id },
                data: {
                    editorDepth: next.editorDepth,
                    editorOrder: next.editorOrder,
                    isStartNode: next.isStartNode,
                    ...(isTarget ? {
                        characterId: characterSelection.characterId,
                        characterSpriteId: characterSelection.characterSpriteId,
                        backgroundId,
                        musicTrackId,
                        text: input.text.trim(),
                        audioUrl: input.audioUrl?.trim() || null,
                        isEndNode: Boolean(input.isEndNode),
                    } : {}),
                    updatedAt: timestamp,
                },
            });
        }
    });

    return hydrateNodeById(id);
}

export async function updateNodeLayout(id: string, input: {
    editorDepth?: number | null;
    editorOrder?: number | null;
}) {
    await ensureBootstrap();
    await prisma.$transaction(async (tx) => {
        const current = await tx.node.findUnique({
            where: { id },
        });
        if (!current) {
            throw new Error('Node not found');
        }

        const storyNodes = (await tx.node.findMany({
            where: { storyId: current.storyId },
            orderBy: [
                { editorDepth: 'asc' },
                { editorOrder: 'asc' },
                { createdAt: 'asc' },
            ],
        })).map(mapNode);
        const nextLayout = buildUpdatedLayoutNodes(storyNodes, id, input);
        const layoutById = new Map(nextLayout.map((node) => [node.id, node]));
        const timestamp = nowDate();

        for (const existing of storyNodes) {
            const next = layoutById.get(existing.id);
            if (!next) {
                continue;
            }
            if (existing.editorDepth !== next.editorDepth || existing.editorOrder !== next.editorOrder || existing.isStartNode !== next.isStartNode) {
                await tx.node.update({
                    where: { id: existing.id },
                    data: {
                        editorDepth: next.editorDepth,
                        editorOrder: next.editorOrder,
                        isStartNode: next.isStartNode,
                        updatedAt: timestamp,
                    },
                });
            }
        }
    });

    return hydrateNodeById(id);
}

export async function deleteNode(id: string) {
    await ensureBootstrap();
    await prisma.$transaction(async (tx) => {
        const node = await tx.node.findUnique({
            where: { id },
        });
        if (!node) {
            return;
        }

        await tx.choice.updateMany({
            where: { targetNodeId: id },
            data: {
                targetNodeId: null,
                updatedAt: nowDate(),
            },
        });
        await tx.choice.deleteMany({
            where: { nodeId: id },
        });
        await tx.node.delete({
            where: { id },
        });

        const remaining = (await tx.node.findMany({
            where: { storyId: node.storyId },
            orderBy: [
                { editorDepth: 'asc' },
                { editorOrder: 'asc' },
                { createdAt: 'asc' },
            ],
        })).map(mapNode);
        reindexStoryLayout(remaining, node.storyId);

        const timestamp = nowDate();
        for (const entry of remaining) {
            await tx.node.update({
                where: { id: entry.id },
                data: {
                    editorDepth: entry.editorDepth,
                    editorOrder: entry.editorOrder,
                    updatedAt: timestamp,
                },
            });
        }
    });
}

export async function createChoice(input: {
    nodeId: string;
    targetNodeId?: string | null;
    text: string;
    scoreImpact?: number;
}) {
    await ensureBootstrap();
    const choice = await prisma.choice.create({
        data: {
            id: randomUUID(),
            nodeId: input.nodeId,
            targetNodeId: input.targetNodeId || null,
            text: input.text.trim(),
            scoreImpact: Number(input.scoreImpact ?? 0),
        },
    });

    return mapChoice(choice);
}

export async function updateChoice(id: string, input: {
    targetNodeId?: string | null;
    text: string;
    scoreImpact?: number;
}) {
    await ensureBootstrap();
    const choice = await prisma.choice.update({
        where: { id },
        data: {
            text: input.text.trim(),
            targetNodeId: input.targetNodeId || null,
            scoreImpact: Number(input.scoreImpact ?? 0),
        },
    });

    return mapChoice(choice);
}

export async function deleteChoice(id: string) {
    await ensureBootstrap();
    await prisma.choice.delete({
        where: { id },
    });
}

export async function listLeaderboard() {
    await ensureBootstrap();
    const scores = await prisma.playerScore.findMany({
        orderBy: [
            { score: 'desc' },
            { createdAt: 'asc' },
        ],
        take: 50,
    });

    return scores.map(mapPlayerScore);
}

export async function createPlayerScore(input: { name?: string | null; score?: number }) {
    await ensureBootstrap();
    const score = await prisma.playerScore.create({
        data: {
            id: randomUUID(),
            name: input.name?.trim() || 'Anonymous Voter',
            score: Number(input.score ?? 0),
        },
    });

    return mapPlayerScore(score);
}

export async function updatePlayerScore(id: string, input: { name?: string | null; score?: number }) {
    await ensureBootstrap();
    const score = await prisma.playerScore.update({
        where: { id },
        data: {
            name: input.name?.trim() || 'Anonymous Voter',
            score: Number(input.score ?? 0),
        },
    });

    return mapPlayerScore(score);
}

export async function deletePlayerScore(id: string) {
    await ensureBootstrap();
    await prisma.playerScore.delete({
        where: { id },
    });
}

export async function writeSeedData() {
    await prisma.$transaction([
        prisma.choice.deleteMany(),
        prisma.node.deleteMany(),
        prisma.characterSprite.deleteMany(),
        prisma.background.deleteMany(),
        prisma.character.deleteMany(),
        prisma.playerScore.deleteMany(),
        prisma.story.deleteMany(),
        prisma.musicTrack.deleteMany(),
        prisma.siteSettings.deleteMany(),
    ]);

    bootstrapPromise = null;
    await ensureBootstrap();
}
