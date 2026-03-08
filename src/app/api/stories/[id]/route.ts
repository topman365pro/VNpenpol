import { NextResponse } from 'next/server';
import { deleteStory, updateStory } from '@/lib/runtime-store';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = (await params).id;
        const json = await request.json();
        const story = await updateStory(id, {
            title: json.title,
            description: json.description,
        });
        return NextResponse.json(story);
    } catch {
        return NextResponse.json({ error: 'Failed to update story' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = (await params).id;
        await deleteStory(id);
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Failed to delete story' }, { status: 500 });
    }
}
