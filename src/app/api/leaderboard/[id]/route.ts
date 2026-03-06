import { NextResponse } from 'next/server';
import { deletePlayerScore, updatePlayerScore } from '@/lib/data-store';

export const dynamic = 'force-dynamic';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = (await params).id;
        const json = await request.json();
        const score = await updatePlayerScore(id, {
            name: json.name,
            score: json.score,
        });
        return NextResponse.json(score);
    } catch {
        return NextResponse.json({ error: 'Failed to update leaderboard entry' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = (await params).id;
        await deletePlayerScore(id);
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Failed to delete leaderboard entry' }, { status: 500 });
    }
}
