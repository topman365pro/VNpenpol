import { NextResponse } from 'next/server';
import { deleteMusicTrack, updateMusicTrack } from '@/lib/runtime-store';

export const dynamic = 'force-dynamic';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = (await params).id;
        const json = await request.json();
        const musicTrack = await updateMusicTrack(id, {
            name: json.name,
            audioUrl: json.audioUrl,
        });
        return NextResponse.json(musicTrack);
    } catch {
        return NextResponse.json({ error: 'Failed to update music track' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = (await params).id;
        await deleteMusicTrack(id);
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Failed to delete music track' }, { status: 500 });
    }
}
