import { mkdir, readdir, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { AssetKind, AssetRecord } from '@/lib/asset-utils';
import { matchesAssetKind } from '@/lib/asset-utils';

const uploadDir = path.join(process.cwd(), 'public', 'uploads');

function sanitizeUploadName(name: string) {
    return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function saveUploadedFile(file: File) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const originalName = sanitizeUploadName(file.name);
    const fileName = `${Date.now()}_${originalName}`;

    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, fileName), buffer);

    return {
        url: `/uploads/${fileName}`,
        name: originalName,
        size: buffer.length,
    };
}

export async function listUploadedAssets(kind?: AssetKind): Promise<AssetRecord[]> {
    try {
        const entries = await readdir(uploadDir);
        const files = await Promise.all(
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

        return files
            .filter((asset) => matchesAssetKind(asset.name, kind))
            .sort((left, right) => new Date(right.modified).getTime() - new Date(left.modified).getTime());
    } catch {
        return [];
    }
}

export async function deleteUploadedAsset(name: string) {
    if (!name || name.includes('..') || name.includes('/') || name.includes('\\')) {
        throw new Error('Invalid filename');
    }

    await unlink(path.join(uploadDir, name));
}
