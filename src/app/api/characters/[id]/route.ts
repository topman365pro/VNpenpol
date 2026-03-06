import { NextResponse } from 'next/server';
import { deleteCharacter, updateCharacter } from '@/lib/data-store';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = (await params).id;
        const json = await request.json();
        const character = await updateCharacter(id, {
            name: json.name,
            spriteImageUrl: json.spriteImageUrl || null,
        });
        return NextResponse.json(character);
    } catch {
        return NextResponse.json({ error: 'Failed to update character' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = (await params).id;
        await deleteCharacter(id);
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Failed to delete character' }, { status: 500 });
    }
}
