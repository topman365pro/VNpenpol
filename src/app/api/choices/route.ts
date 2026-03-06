import { NextResponse } from 'next/server';
import { createChoice } from '@/lib/data-store';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const json = await request.json();
        const choice = await createChoice({
            nodeId: json.nodeId,
            targetNodeId: json.targetNodeId || null,
            text: json.text,
            scoreImpact: json.scoreImpact || 0,
        });
        return NextResponse.json(choice, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Failed to create choice' }, { status: 500 });
    }
}
