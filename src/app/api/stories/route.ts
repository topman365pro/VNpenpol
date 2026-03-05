import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const stories = await prisma.story.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                nodes: true,
            }
        });
        return NextResponse.json(stories);
    } catch {
        return NextResponse.json({ error: 'Failed to fetch stories' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const json = await request.json();
        const story = await prisma.story.create({
            data: {
                title: json.title,
                description: json.description,
            },
        });
        return NextResponse.json(story, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Failed to create story' }, { status: 500 });
    }
}

