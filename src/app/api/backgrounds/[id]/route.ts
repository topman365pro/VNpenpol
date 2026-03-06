import { NextResponse } from 'next/server';
import { deleteBackground, updateBackground } from '@/lib/data-store';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = (await params).id;
        const json = await request.json();
        const background = await updateBackground(id, {
            name: json.name,
            imageUrl: json.imageUrl,
        });
        return NextResponse.json(background);
    } catch {
        return NextResponse.json({ error: 'Failed to update background' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = (await params).id;
        await deleteBackground(id);
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Failed to delete background' }, { status: 500 });
    }
}
