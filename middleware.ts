import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// All routes that are completely public (no auth required)
const publicRoutePrefixes = [
    '/',
    '/login',
    '/about',
    '/features',
    '/pricing',
    '/contact',
    '/blog',
    '/privacy',
    '/terms',
    '/use-cases',
    '/integrations',
    // Public tool pages
    '/email-verifier',
    '/spam-checker',
    '/tools',
    // API routes
    '/api/auth',
    '/api/track',
    '/api/verify',
    '/api/blogs',
];

// Routes where logged-in users should be redirected away
const authOnlyRoutes = ['/', '/login'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Always allow static assets
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/fonts') ||
        pathname.endsWith('.png') ||
        pathname.endsWith('.jpg') ||
        pathname.endsWith('.jpeg') ||
        pathname.endsWith('.gif') ||
        pathname.endsWith('.svg') ||
        pathname.endsWith('.ico') ||
        pathname.endsWith('.webp') ||
        pathname === '/favicon.ico'
    ) {
        return NextResponse.next();
    }

    // Check if this is a public route
    const isPublic = publicRoutePrefixes.some(prefix =>
        pathname === prefix ||
        pathname.startsWith(prefix + '/') ||
        (prefix === '/' && pathname === '/')
    );

    if (isPublic) {
        // Route is public — but still check if logged-in user should be redirected
        const token = request.cookies.get('auth_token')?.value;
        if (token && authOnlyRoutes.includes(pathname)) {
            try {
                const parsed = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
                if (parsed?.userId) {
                    if (parsed.role === 'master') {
                        return NextResponse.redirect(new URL('/admin', request.url));
                    }
                    return NextResponse.redirect(new URL('/dashboard', request.url));
                }
            } catch (_) {
                // Bad token — clear it and let them through
                const response = NextResponse.next();
                response.cookies.delete('auth_token');
                return response;
            }
        }
        return NextResponse.next();
    }

    // Protected route — check auth
    const token = request.cookies.get('auth_token')?.value;
    let session: any = null;

    if (token) {
        try {
            const parsed = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
            if (parsed?.userId) {
                session = parsed;
            } else {
                throw new Error('Invalid token');
            }
        } catch (_) {
            const response = NextResponse.redirect(new URL('/login', request.url));
            response.cookies.delete('auth_token');
            return response;
        }
    }

    if (!session) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Admin-only routes
    if (pathname.startsWith('/admin')) {
        if (session.role !== 'master') {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
