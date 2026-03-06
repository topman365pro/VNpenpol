import { NextResponse } from 'next/server';
import { createPlayerScore, getSiteSettings, listLeaderboard } from '@/lib/data-store';

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
        const settings = await getSiteSettings();
        const fallbackName = settings.publicLocale === 'id' ? 'Pemilih Anonim' : 'Anonymous Voter';
        const scoreRecord = await createPlayerScore({
            name: json.name || fallbackName,
            score: json.score || 0,
        });
        return NextResponse.json(scoreRecord, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Failed to submit score' }, { status: 500 });
    }
}
