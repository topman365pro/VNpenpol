import { NextResponse } from 'next/server';
import { createPlayerScore, listLeaderboard } from '@/lib/runtime-store';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const scores = await listLeaderboard();
        return NextResponse.json(scores);
    } catch {
        return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const json = await request.json();
        const scoreRecord = await createPlayerScore({
            name: json.name || 'Anonymous Voter',
            score: json.score || 0,
        });
        return NextResponse.json(scoreRecord, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Failed to create leaderboard entry' }, { status: 500 });
    }
}
