import { NextResponse } from 'next/server';
import { createStory, listStories } from '@/lib/runtime-store';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const stories = await listStories();
        return NextResponse.json(stories);
    } catch {
        return NextResponse.json({ error: 'Failed to fetch stories' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const json = await request.json();
        const story = await createStory({
            title: json.title,
            description: json.description,
        });
        return NextResponse.json(story, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Failed to create story' }, { status: 500 });
    }
}
