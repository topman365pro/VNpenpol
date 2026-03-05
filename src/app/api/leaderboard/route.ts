import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const scores = await prisma.playerScore.findMany({
            orderBy: { score: 'desc' },
            take: 50, // Top 50 scores
        });
        return NextResponse.json(scores);
    } catch {
        return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const json = await request.json();
        const scoreRecord = await prisma.playerScore.create({
            data: {
                name: json.name || 'Anonymous Voter',
                score: json.score || 0,
            },
        });
        return NextResponse.json(scoreRecord, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Failed to submit score' }, { status: 500 });
    }
}

