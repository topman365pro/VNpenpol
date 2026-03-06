import { getSiteSettings } from '@/lib/data-store';
import { getPublicCopy } from '@/lib/public-copy';
import GamePageClient from '@/components/public/GamePageClient';

export const dynamic = 'force-dynamic';

export default async function GamePage({
    params,
}: {
    params: Promise<{ storyId: string }>;
}) {
    const { storyId } = await params;
    const { publicLocale } = await getSiteSettings();
    const copy = getPublicCopy(publicLocale);

    return (
        <GamePageClient
            storyId={storyId}
            locale={publicLocale}
            copy={copy.game}
        />
    );
}
