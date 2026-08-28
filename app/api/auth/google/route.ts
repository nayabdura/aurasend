import { NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * GET /api/auth/google
 * Initiates Google OAuth flow for APP LOGIN (not Gmail SMTP).
 * Requires GOOGLE_CLIENT_ID to be configured in environment variables.
 */
export async function GET(req: Request) {
    const clientId = process.env.GOOGLE_CLIENT_ID;

    if (!clientId) {
        return NextResponse.redirect(
            new URL('/login?error=google_not_configured', req.url)
        );
    }

    const origin = new URL(req.url).origin;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${origin}/api/auth/google/callback`;

    // Generate CSRF state token
    const state = crypto.randomBytes(32).toString('hex');

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'offline',
        prompt: 'select_account',
        state: state
    });

    const response = NextResponse.redirect(
        `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
    );

    // Set state cookie for validation in callback
    response.cookies.set('oauth_state', state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 10, // 10 minutes
    });

    return response;
}
