import './globals.css';
import type { Metadata } from 'next';
import { getSiteSettings } from '@/lib/runtime-store';
import { getPublicCopy } from '@/lib/public-copy';
import { Analytics } from '@vercel/analytics/next';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
    const { publicLocale } = await getSiteSettings();
    const copy = getPublicCopy(publicLocale);

    return {
        title: copy.metadata.title,
        description: copy.metadata.description,
    };
}

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { publicLocale } = await getSiteSettings();

    return (
        <html lang={publicLocale}>
            <body>
                {children}
                <Analytics />
            </body>
        </html>
    );
}
