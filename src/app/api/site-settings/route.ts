import { NextResponse } from 'next/server';
import { getSiteSettings, updateSiteSettings } from '@/lib/data-store';

export const dynamic = 'force-dynamic';

function isValidLocale(value: unknown): value is 'id' | 'en' {
    return value === 'id' || value === 'en';
}

export async function GET() {
    try {
        const settings = await getSiteSettings();
        return NextResponse.json(settings);
    } catch {
        return NextResponse.json({ error: 'Failed to fetch site settings' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const payload = await request.json();
        if (!isValidLocale(payload.publicLocale)) {
            return NextResponse.json({ error: 'Invalid public locale' }, { status: 400 });
        }

        const settings = await updateSiteSettings({ publicLocale: payload.publicLocale });
        return NextResponse.json(settings);
    } catch {
        return NextResponse.json({ error: 'Failed to update site settings' }, { status: 500 });
    }
}
