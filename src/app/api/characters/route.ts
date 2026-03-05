import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const characters = await prisma.character.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(characters);
    } catch {
        return NextResponse.json({ error: 'Failed to fetch characters' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const json = await request.json();
        const character = await prisma.character.create({
            data: {
                name: json.name,
                spriteImageUrl: json.spriteImageUrl || null,
            },
        });
        return NextResponse.json(character, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Failed to create character' }, { status: 500 });
    }
}

