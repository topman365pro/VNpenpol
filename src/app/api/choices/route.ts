import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const json = await request.json();
        const choice = await prisma.choice.create({
            data: {
                nodeId: json.nodeId,
                targetNodeId: json.targetNodeId || null,
                text: json.text,
                scoreImpact: json.scoreImpact || 0,
            },
        });
        return NextResponse.json(choice, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create choice' }, { status: 500 });
    }
}
