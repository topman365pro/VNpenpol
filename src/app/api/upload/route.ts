import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Sanitize filename
        const originalName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const timestamp = Date.now();
        const fileName = `${timestamp}_${originalName}`;

        // Ensure upload directory exists
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        await mkdir(uploadDir, { recursive: true });

        const filePath = path.join(uploadDir, fileName);
        await writeFile(filePath, buffer);

        const publicUrl = `/uploads/${fileName}`;

        return NextResponse.json({
            url: publicUrl,
            name: originalName,
            size: buffer.length,
        }, { status: 201 });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }
}
