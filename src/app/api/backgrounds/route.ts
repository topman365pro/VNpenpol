import { NextResponse } from 'next/server';
import { createBackground, listBackgrounds } from '@/lib/data-store';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const backgrounds = await listBackgrounds();
        return NextResponse.json(backgrounds);
    } catch {
        return NextResponse.json({ error: 'Failed to fetch backgrounds' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const json = await request.json();
        const background = await createBackground({
            name: json.name,
            imageUrl: json.imageUrl,
        });
        return NextResponse.json(background, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Failed to create background' }, { status: 500 });
    }
}
