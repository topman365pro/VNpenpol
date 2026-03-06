import { NextResponse } from 'next/server';
import { createCharacter, listCharacters } from '@/lib/data-store';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const characters = await listCharacters();
        return NextResponse.json(characters);
    } catch {
        return NextResponse.json({ error: 'Failed to fetch characters' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const json = await request.json();
        const character = await createCharacter({
            name: json.name,
            spriteImageUrl: json.spriteImageUrl || null,
        });
        return NextResponse.json(character, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Failed to create character' }, { status: 500 });
    }
}
