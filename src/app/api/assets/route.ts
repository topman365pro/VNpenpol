import { NextResponse } from 'next/server';
import { readdir, unlink, stat } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');

        let files: { name: string; url: string; size: number; modified: string }[] = [];
        try {
            const entries = await readdir(uploadDir);
            files = await Promise.all(
                entries.map(async (name) => {
                    const filePath = path.join(uploadDir, name);
                    const fileStat = await stat(filePath);
                    return {
                        name,
                        url: `/uploads/${name}`,
                        size: fileStat.size,
                        modified: fileStat.mtime.toISOString(),
                    };
                })
            );
            files.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());
        } catch {
            // Directory doesn't exist yet — return empty
        }

        return NextResponse.json(files);
    } catch {
        return NextResponse.json({ error: 'Failed to list assets' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { name } = await request.json();
        if (!name || name.includes('..') || name.includes('/') || name.includes('\\')) {
            return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
        }
        const filePath = path.join(process.cwd(), 'public', 'uploads', name);
        await unlink(filePath);
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 });
    }
}
