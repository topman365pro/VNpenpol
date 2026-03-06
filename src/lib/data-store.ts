import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

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
    spriteImageUrl: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface NodeRecord {
    id: string;
    storyId: string;
    characterId: string | null;
    text: string;
    backgroundImageUrl: string | null;
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

interface DatabaseShape {
    stories: StoryRecord[];
    characters: CharacterRecord[];
    nodes: NodeRecord[];
    choices: ChoiceRecord[];
    playerScores: PlayerScoreRecord[];
}

const dataDir = path.join(process.cwd(), 'data');
const dataFile = path.join(dataDir, 'db.json');

function nowIso() {
    return new Date().toISOString();
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
                spriteImageUrl: '/demo/amira-portrait.svg',
                createdAt,
                updatedAt: createdAt,
            },
            {
                id: 'char-bima',
                name: 'Bima Hartono',
                spriteImageUrl: '/demo/bima-portrait.svg',
                createdAt,
                updatedAt: createdAt,
            },
        ],
        nodes: [
            {
                id: 'node-opening',
                storyId: 'story-demo-merdeka',
                characterId: null,
                text: 'Rain presses against the glass roof of Merdeka Hall as students, journalists, and city workers fill the chamber. Tonight, your campaign will either earn trust or lose the room.',
                backgroundImageUrl: '/demo/hall-bg.svg',
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
                text: 'Amira straightens a stack of notes. "We can cut commute times in half with an electric tram loop, but only if we protect the neighborhoods it passes through."',
                backgroundImageUrl: '/demo/debate-bg.svg',
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
                text: 'Bima leans into the microphone. "People want relief now. Freeze fares, pause the construction, and stop asking working families to gamble on a promise."',
                backgroundImageUrl: '/demo/debate-bg.svg',
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
                text: 'You back a neighborhood-first plan: phased construction, rent protections near stations, and a citizen oversight board. The crowd softens. Several union leaders begin taking notes.',
                backgroundImageUrl: '/demo/community-bg.svg',
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
                text: 'You endorse a fare freeze with no replacement funding. The applause is loud, but a transport analyst in the front row whispers that the buses will start failing within months.',
                backgroundImageUrl: '/demo/community-bg.svg',
                audioUrl: null,
                isStartNode: false,
                isEndNode: false,
                createdAt,
                updatedAt: createdAt,
            },
            {
                id: 'node-reform-ending',
                storyId: 'story-demo-merdeka',
                characterId: null,
                text: 'By midnight, the headline reads: "Candidate Trades Speed for Trust, Wins the Room." The plan is slower, harder, and politically expensive, but people believe it belongs to them.',
                backgroundImageUrl: '/demo/night-bg.svg',
                audioUrl: null,
                isStartNode: false,
                isEndNode: true,
                createdAt,
                updatedAt: createdAt,
            },
            {
                id: 'node-collapse-ending',
                storyId: 'story-demo-merdeka',
                characterId: null,
                text: 'Three weeks later the temporary fare freeze collapses under debt pressure. Your rally clips still trend online, but riders are angrier than before and trust is harder to rebuild.',
                backgroundImageUrl: '/demo/night-bg.svg',
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
    };
}

async function writeDatabase(db: DatabaseShape) {
    await mkdir(dataDir, { recursive: true });
    await writeFile(dataFile, JSON.stringify(db, null, 2));
}

async function readDatabase(): Promise<DatabaseShape> {
    try {
        const raw = await readFile(dataFile, 'utf8');
        const db = JSON.parse(raw) as DatabaseShape;
        if (db.stories.length > 0) {
            return db;
        }
    } catch {
        // Fall through to seed creation.
    }

    const seeded = seedDatabase();
    await writeDatabase(seeded);
    return seeded;
}

function hydrateNode(node: NodeRecord, db: DatabaseShape) {
    const choices = db.choices
        .filter((choice) => choice.nodeId === node.id)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    const character = node.characterId
        ? db.characters.find((entry) => entry.id === node.characterId) ?? null
        : null;

    return {
        ...node,
        character,
        choices,
    };
}

export async function listStories() {
    const db = await readDatabase();
    return db.stories
        .slice()
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((story) => ({
            ...story,
            nodes: db.nodes.filter((node) => node.storyId === story.id),
        }));
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
    return db.characters.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createCharacter(input: { name: string; spriteImageUrl?: string | null }) {
    const db = await readDatabase();
    const timestamp = nowIso();
    const character: CharacterRecord = {
        id: randomUUID(),
        name: input.name.trim(),
        spriteImageUrl: input.spriteImageUrl?.trim() || null,
        createdAt: timestamp,
        updatedAt: timestamp,
    };
    db.characters.push(character);
    await writeDatabase(db);
    return character;
}

export async function updateCharacter(id: string, input: { name: string; spriteImageUrl?: string | null }) {
    const db = await readDatabase();
    const character = db.characters.find((entry) => entry.id === id);
    if (!character) {
        throw new Error('Character not found');
    }
    character.name = input.name.trim();
    character.spriteImageUrl = input.spriteImageUrl?.trim() || null;
    character.updatedAt = nowIso();
    await writeDatabase(db);
    return character;
}

export async function deleteCharacter(id: string) {
    const db = await readDatabase();
    db.characters = db.characters.filter((character) => character.id !== id);
    db.nodes = db.nodes.map((node) => (
        node.characterId === id
            ? { ...node, characterId: null, updatedAt: nowIso() }
            : node
    ));
    await writeDatabase(db);
}

export async function listNodes(storyId?: string) {
    const db = await readDatabase();
    return db.nodes
        .filter((node) => !storyId || node.storyId === storyId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .map((node) => hydrateNode(node, db));
}

export async function createNode(input: {
    storyId: string;
    characterId?: string | null;
    text: string;
    backgroundImageUrl?: string | null;
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

    const node: NodeRecord = {
        id: randomUUID(),
        storyId: input.storyId,
        characterId: input.characterId || null,
        text: input.text.trim(),
        backgroundImageUrl: input.backgroundImageUrl?.trim() || null,
        audioUrl: input.audioUrl?.trim() || null,
        isStartNode: Boolean(input.isStartNode),
        isEndNode: Boolean(input.isEndNode),
        createdAt: timestamp,
        updatedAt: timestamp,
    };

    db.nodes.push(node);
    await writeDatabase(db);
    return node;
}

export async function updateNode(id: string, input: {
    characterId?: string | null;
    text: string;
    backgroundImageUrl?: string | null;
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

    updatedNode.characterId = input.characterId || null;
    updatedNode.text = input.text.trim();
    updatedNode.backgroundImageUrl = input.backgroundImageUrl?.trim() || null;
    updatedNode.audioUrl = input.audioUrl?.trim() || null;
    updatedNode.isStartNode = Boolean(input.isStartNode);
    updatedNode.isEndNode = Boolean(input.isEndNode);
    updatedNode.updatedAt = timestamp;

    await writeDatabase(db);
    return updatedNode;
}

export async function deleteNode(id: string) {
    const db = await readDatabase();
    db.nodes = db.nodes.filter((node) => node.id !== id);
    db.choices = db.choices
        .filter((choice) => choice.nodeId !== id)
        .map((choice) => (
            choice.targetNodeId === id
                ? { ...choice, targetNodeId: null, updatedAt: nowIso() }
                : choice
        ));
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
        .sort((a, b) => b.score - a.score || a.createdAt.localeCompare(b.createdAt))
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

export async function writeSeedData() {
    const seeded = seedDatabase();
    await writeDatabase(seeded);
    return seeded;
}
