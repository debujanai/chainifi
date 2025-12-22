
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SMART_MONEY_ROUTES = [
    '/',
    '/holdings',
    '/dex-trades',
    '/perp-trades',
    '/api/smartmoney',
    '/api/token-metadata',
];

export function middleware(request: NextRequest) {
    const isProduction = process.env.NEXT_PUBLIC_APP_MODE === 'production';

    if (isProduction) {
        const { pathname } = request.nextUrl;

        // Allow static files and public assets
        if (
            pathname.startsWith('/_next') ||
            pathname.startsWith('/static') ||
            pathname.includes('.') // matches logo.png, etc.
        ) {
            return NextResponse.next();
        }

        const isAllowed = SMART_MONEY_ROUTES.some(route =>
            pathname === route || pathname.startsWith(route + '/')
        );

        if (!isAllowed) {
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};
