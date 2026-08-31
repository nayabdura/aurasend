import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_super_secret_key_change_in_production!';
const encodedSecret = new TextEncoder().encode(JWT_SECRET);

interface JwtSession {
  userId: number;
  email: string;
  role: 'MASTER' | 'ADMIN' | 'USER' | 'master' | 'admin' | 'user';
  workspaceId: number;
  ip?: string;
  exp?: number;
  iat?: number;
}

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
    '/api/verify-email',
    '/api/spam-check',
    '/api/blogs',
    '/api/billing/webhook',
    // Static files
    '/robots.txt',
    '/sitemap.xml',
    '/favicon.ico',
];

// Routes where logged-in users should be redirected away
const authOnlyRoutes = ['/', '/login'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Security: Block any direct attempts to access database files, env files, or backups
    if (/\.(?:db|sqlite3?|bak|env|sql|pem|log|zip)$/i.test(pathname) || pathname.includes('cold-email.db')) {
        return new NextResponse(JSON.stringify({ error: 'Access Denied: Protected System Resource' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // Always allow static assets and verification files (fast regex check)
    if (/\.(?:png|jpe?g|gif|svg|ico|webp|woff2?|ttf|otf|css|js|map|html|txt)$/i.test(pathname) || /^google[a-z0-9]+\.html$/i.test(pathname.replace(/^\//, ''))) {
        return NextResponse.next();
    }
    if (pathname.startsWith('/_next') || pathname.startsWith('/fonts')) {
        return NextResponse.next();
    }

    // Add security headers to response
    const setSecurityHeaders = (response: NextResponse) => {
        response.headers.set('X-Frame-Options', 'DENY');
        response.headers.set('X-Content-Type-Options', 'nosniff');
        response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
        response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
        response.headers.set(
            'Content-Security-Policy',
            "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https: wss: https://api.stripe.com https://generativelanguage.googleapis.com; frame-src 'self' https://js.stripe.com;"
        );
        return response;
    };

    // Check if this is a public route
    const isPublic = publicRoutePrefixes.some(prefix =>
        pathname === prefix ||
        pathname.startsWith(prefix + '/') ||
        (prefix === '/' && pathname === '/')
    );

    if (isPublic) {
        // Route is public — check if logged-in user accessing login page
        const token = request.cookies.get('auth_token')?.value;
        if (token && authOnlyRoutes.includes(pathname)) {
            try {
                const { payload } = await jwtVerify(token, encodedSecret);
                if (payload?.userId) {
                    const role = String(payload.role || '').toUpperCase();
                    if (role === 'MASTER' || role === 'ADMIN') {
                        return setSecurityHeaders(NextResponse.redirect(new URL('/admin', request.url)));
                    }
                    return setSecurityHeaders(NextResponse.redirect(new URL('/dashboard', request.url)));
                }
            } catch (_) {
                const response = setSecurityHeaders(NextResponse.next());
                response.cookies.delete('auth_token');
                return response;
            }
        }
        return setSecurityHeaders(NextResponse.next());
    }

    // Protected route — verify JWT
    const token = request.cookies.get('auth_token')?.value;
    let session: JwtSession | null = null;

    if (token) {
        try {
            const { payload } = await jwtVerify(token, encodedSecret);
            if (payload?.userId) {
                session = {
                    userId: Number(payload.userId),
                    email: String(payload.email ?? ''),
                    role: (String(payload.role ?? 'USER').toUpperCase() as JwtSession['role']),
                    workspaceId: Number(payload.workspaceId ?? 1),
                    ip: payload.ip as string | undefined,
                    exp: payload.exp,
                    iat: payload.iat,
                };
            } else {
                throw new Error('Invalid token');
            }
        } catch (_) {
            const response = setSecurityHeaders(NextResponse.redirect(new URL('/login', request.url)));
            response.cookies.delete('auth_token');
            return response;
        }
    }

    if (!session) {
        if (pathname.startsWith('/api/')) {
            return setSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
        }
        return setSecurityHeaders(NextResponse.redirect(new URL('/login', request.url)));
    }

    // Enforce Admin-only routes for both pages & APIs
    if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
        const userRole = String(session.role).toUpperCase();
        if (userRole !== 'MASTER' && userRole !== 'ADMIN') {
            if (pathname.startsWith('/api/')) {
                return setSecurityHeaders(NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 }));
            }
            return setSecurityHeaders(NextResponse.redirect(new URL('/dashboard', request.url)));
        }
    }

    let finalResponse = setSecurityHeaders(NextResponse.next());

    // SLIDING SESSION: Refresh JWT if expiring in less than 3 days
    if (session && session.exp) {
        const timeRemaining = (session.exp * 1000) - Date.now();
        const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
        
        if (timeRemaining < threeDaysInMs) {
            const newToken = await new SignJWT({
                userId: session.userId,
                email: session.email,
                role: session.role,
                workspaceId: session.workspaceId,
                ip: session.ip
            })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('7d')
            .sign(encodedSecret);
            
            finalResponse.cookies.set('auth_token', newToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7 // 7 days
            });
        }
    }

    return finalResponse;
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

