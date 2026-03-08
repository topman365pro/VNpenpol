import { NextResponse } from 'next/server';
import { createMusicTrack, listMusicTracks } from '@/lib/runtime-store';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const musicTracks = await listMusicTracks();
        return NextResponse.json(musicTracks);
    } catch {
        return NextResponse.json({ error: 'Failed to fetch music tracks' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const json = await request.json();
        const musicTrack = await createMusicTrack({
            name: json.name,
            audioUrl: json.audioUrl,
        });
        return NextResponse.json(musicTrack, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Failed to create music track' }, { status: 500 });
    }
}
