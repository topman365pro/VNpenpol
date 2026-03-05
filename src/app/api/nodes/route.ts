import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const storyId = searchParams.get('storyId');

    try {
        const nodes = await prisma.node.findMany({
            where: storyId ? { storyId } : undefined,
            include: {
                choices: true,
                character: true,
            },
            orderBy: { createdAt: 'asc' },
        });
        return NextResponse.json(nodes);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch nodes' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const json = await request.json();
        const node = await prisma.node.create({
            data: {
                storyId: json.storyId,
                characterId: json.characterId || null,
                text: json.text,
                backgroundImageUrl: json.backgroundImageUrl || null,
                audioUrl: json.audioUrl || null,
                isStartNode: json.isStartNode || false,
                isEndNode: json.isEndNode || false,
            },
        });
        return NextResponse.json(node, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create node' }, { status: 500 });
    }
}
