'use client';

import type { ChangeEvent, CSSProperties } from 'react';

interface AssetUploadButtonProps {
    label: string;
    loadingLabel?: string;
    uploading?: boolean;
    accept?: string;
    multiple?: boolean;
    onFilesSelected: (files: File[]) => Promise<unknown> | void;
    className?: string;
    style?: CSSProperties;
}

export default function AssetUploadButton({
    label,
    loadingLabel = 'Uploading...',
    uploading = false,
    accept,
    multiple = false,
    onFilesSelected,
    className = 'btn btn-primary',
    style,
}: AssetUploadButtonProps) {
    async function handleChange(event: ChangeEvent<HTMLInputElement>) {
        const files = Array.from(event.target.files ?? []);
        if (files.length > 0) {
            await onFilesSelected(files);
        }
        event.target.value = '';
    }

    return (
        <label className={className} style={{ cursor: 'pointer', ...style }}>
            {uploading ? loadingLabel : label}
            <input
                type="file"
                multiple={multiple}
                accept={accept}
                style={{ display: 'none' }}
                onChange={handleChange}
            />
        </label>
    );
}
