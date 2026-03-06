import { NextResponse } from 'next/server';
import { deleteUploadedAsset, listUploadedAssets } from '@/lib/upload-store';
import type { AssetKind } from '@/lib/asset-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const kindParam = searchParams.get('kind');
        const kind = kindParam === 'image' || kindParam === 'audio' ? kindParam as AssetKind : undefined;
        const files = await listUploadedAssets(kind);
        return NextResponse.json(files);
    } catch {
        return NextResponse.json({ error: 'Failed to list assets' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { name } = await request.json();
        await deleteUploadedAsset(name);
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 });
    }
}
