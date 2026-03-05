import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = (await params).id;
        const json = await request.json();
        const choice = await prisma.choice.update({
            where: { id },
            data: {
                text: json.text,
                targetNodeId: json.targetNodeId || null,
                scoreImpact: json.scoreImpact !== undefined ? Number(json.scoreImpact) : 0,
            },
        });
        return NextResponse.json(choice);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update choice' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = (await params).id;
        await prisma.choice.delete({
            where: { id },
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete choice' }, { status: 500 });
    }
}
