import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function isProtectedRoute(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
        return true;
    }

    return [
        '/api/stories',
        '/api/characters',
        '/api/backgrounds',
        '/api/nodes',
        '/api/choices',
        '/api/assets',
        '/api/upload',
        '/api/site-settings',
    ].some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function unauthorizedResponse() {
    return new NextResponse('Authentication required', {
        status: 401,
        headers: {
            'WWW-Authenticate': 'Basic realm="PILAR Admin"',
        },
    });
}

function decodeBasicAuth(value: string) {
    try {
        return atob(value);
    } catch {
        return null;
    }
}

export function middleware(request: NextRequest) {
    if (!isProtectedRoute(request)) {
        return NextResponse.next();
    }

    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminUsername || !adminPassword) {
        return new NextResponse('Admin credentials are not configured.', { status: 500 });
    }

    const authorization = request.headers.get('authorization');
    if (!authorization?.startsWith('Basic ')) {
        return unauthorizedResponse();
    }

    const decoded = decodeBasicAuth(authorization.slice('Basic '.length));
    if (!decoded) {
        return unauthorizedResponse();
    }

    const separatorIndex = decoded.indexOf(':');
    const username = separatorIndex >= 0 ? decoded.slice(0, separatorIndex) : decoded;
    const password = separatorIndex >= 0 ? decoded.slice(separatorIndex + 1) : '';

    if (username !== adminUsername || password !== adminPassword) {
        return unauthorizedResponse();
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/api/admin/:path*',
        '/api/stories/:path*',
        '/api/characters/:path*',
        '/api/backgrounds/:path*',
        '/api/nodes/:path*',
        '/api/choices/:path*',
        '/api/assets/:path*',
        '/api/upload/:path*',
        '/api/site-settings/:path*',
    ],
};
