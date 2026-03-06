export interface AssetRecord {
    name: string;
    url: string;
    size: number;
    modified: string;
}

export type AssetKind = 'image' | 'audio';

const imagePattern = /\.(jpg|jpeg|png|gif|webp|svg)$/i;
const audioPattern = /\.(mp3|wav|ogg|m4a)$/i;

export function isImageAsset(name: string) {
    return imagePattern.test(name);
}

export function isAudioAsset(name: string) {
    return audioPattern.test(name);
}

export function matchesAssetKind(name: string, kind?: AssetKind) {
    if (!kind) {
        return true;
    }
    return kind === 'image' ? isImageAsset(name) : isAudioAsset(name);
}

export function formatAssetSize(bytes: number) {
    if (bytes < 1024) {
        return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function prettyUploadedAssetName(name: string) {
    return name.replace(/^\d+_/, '');
}

export function stripAssetExtension(name: string) {
    return name.replace(/\.[^.]+$/, '');
}

export function deriveAssetLabel(value: string, fallback = 'Untitled Asset') {
    const source = value.split('/').pop() || value;
    const normalized = stripAssetExtension(prettyUploadedAssetName(source))
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    if (!normalized) {
        return fallback;
    }

    return normalized
        .split(' ')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}
