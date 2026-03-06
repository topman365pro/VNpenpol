'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AssetKind, AssetRecord } from '@/lib/asset-utils';

interface UploadedAsset {
    url: string;
    name: string;
    size: number;
}

export function useAssetLibrary(kind?: AssetKind) {
    const [assets, setAssets] = useState<AssetRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    const refreshAssets = useCallback(async () => {
        setLoading(true);
        const response = await fetch(kind ? `/api/assets?kind=${kind}` : '/api/assets');
        if (response.ok) {
            setAssets(await response.json());
        }
        setLoading(false);
    }, [kind]);

    useEffect(() => {
        const timer = setTimeout(() => {
            refreshAssets();
        }, 0);
        return () => clearTimeout(timer);
    }, [refreshAssets]);

    const uploadFiles = useCallback(async (files: File[] | FileList) => {
        const selectedFiles = Array.from(files);
        if (selectedFiles.length === 0) {
            return [] as UploadedAsset[];
        }

        setUploading(true);
        const uploaded: UploadedAsset[] = [];
        for (const file of selectedFiles) {
            const formData = new FormData();
            formData.append('file', file);
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                uploaded.push(await response.json());
            }
        }

        setUploading(false);
        await refreshAssets();
        return uploaded;
    }, [refreshAssets]);

    return {
        assets,
        loading,
        uploading,
        refreshAssets,
        uploadFiles,
    };
}
