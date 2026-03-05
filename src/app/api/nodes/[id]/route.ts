import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = (await params).id;
        const json = await request.json();
        const node = await prisma.node.update({
            where: { id },
            data: {
                characterId: json.characterId || null,
                text: json.text,
                backgroundImageUrl: json.backgroundImageUrl || null,
                audioUrl: json.audioUrl || null,
                isStartNode: json.isStartNode,
                isEndNode: json.isEndNode,
            },
        });
        return NextResponse.json(node);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update node' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = (await params).id;
        await prisma.node.delete({
            where: { id },
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete node' }, { status: 500 });
    }
}
