import { NextResponse } from 'next/server';
import { createNode, listNodes } from '@/lib/runtime-store';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const storyId = searchParams.get('storyId');

    try {
        const nodes = await listNodes(storyId || undefined);
        return NextResponse.json(nodes);
    } catch {
        return NextResponse.json({ error: 'Failed to fetch nodes' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const json = await request.json();
        const node = await createNode({
            storyId: json.storyId,
            characterId: json.characterId || null,
            characterSpriteId: json.characterSpriteId || null,
            backgroundId: json.backgroundId || null,
            musicTrackId: json.musicTrackId || null,
            editorDepth: typeof json.editorDepth === 'number' ? json.editorDepth : null,
            editorOrder: typeof json.editorOrder === 'number' ? json.editorOrder : null,
            text: json.text,
            backgroundImageUrl: json.backgroundImageUrl || null,
            audioUrl: json.audioUrl || null,
            isStartNode: json.isStartNode || false,
            isEndNode: json.isEndNode || false,
        });
        return NextResponse.json(node, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Failed to create node' }, { status: 500 });
    }
}
