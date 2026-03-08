import { mkdir, readdir, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { del, list, put } from '@vercel/blob';
import type { AssetKind, AssetRecord } from '@/lib/asset-utils';
import { matchesAssetKind } from '@/lib/asset-utils';

const uploadDir = path.join(process.cwd(), 'public', 'uploads');
const uploadPrefix = 'uploads/';

function isBlobConfigured() {
    return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function sanitizeUploadName(name: string) {
    return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function saveUploadedFile(file: File) {
    const originalName = sanitizeUploadName(file.name);
    const fileName = `${Date.now()}_${originalName}`;

    if (isBlobConfigured()) {
        const blob = await put(`${uploadPrefix}${fileName}`, file, {
            access: 'public',
            addRandomSuffix: false,
        });

        return {
            url: blob.url,
            name: fileName,
            size: file.size,
        };
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, fileName), buffer);

    return {
        url: `/uploads/${fileName}`,
        name: originalName,
        size: buffer.length,
    };
}

export async function listUploadedAssets(kind?: AssetKind): Promise<AssetRecord[]> {
    if (isBlobConfigured()) {
        const { blobs } = await list({
            prefix: uploadPrefix,
            limit: 1000,
        });

        return blobs
            .map((blob) => ({
                name: blob.pathname.replace(uploadPrefix, ''),
                url: blob.url,
                size: blob.size,
                modified: blob.uploadedAt.toISOString(),
            }))
            .filter((asset) => matchesAssetKind(asset.name, kind))
            .sort((left, right) => new Date(right.modified).getTime() - new Date(left.modified).getTime());
    }

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

    if (isBlobConfigured()) {
        await del(`${uploadPrefix}${name}`);
        return;
    }

    await unlink(path.join(uploadDir, name));
}
