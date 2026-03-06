import { NextResponse } from 'next/server';
import { deleteNode, updateNode } from '@/lib/data-store';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = (await params).id;
        const json = await request.json();
        const node = await updateNode(id, {
            characterId: json.characterId || null,
            text: json.text,
            backgroundImageUrl: json.backgroundImageUrl || null,
            audioUrl: json.audioUrl || null,
            isStartNode: json.isStartNode,
            isEndNode: json.isEndNode,
        });
        return NextResponse.json(node);
    } catch {
        return NextResponse.json({ error: 'Failed to update node' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = (await params).id;
        await deleteNode(id);
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Failed to delete node' }, { status: 500 });
    }
}
