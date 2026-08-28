import { NextResponse } from 'next/server';
import db from '@/lib/db';
import prisma from '@/lib/prisma';
import { createToken } from '@/lib/auth';
import { cookies } from 'next/headers';

/**
 * GET /api/auth/google/callback
 * Handles Google OAuth callback for APP LOGIN.
 * Creates or links user account based on Google profile.
 */
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    if (error || !code) {
        const msg = error === 'access_denied' ? 'Google sign-in was cancelled.' : (error || 'OAuth failed');
        return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(msg)}`, req.url));
    }

    // CSRF Protection validation
    const cookieStore = cookies();
    const storedState = cookieStore.get('oauth_state')?.value;

    if (!state || !storedState || state !== storedState) {
        cookieStore.delete('oauth_state');
        return NextResponse.redirect(new URL('/login?error=invalid_csrf_state', req.url));
    }

    cookieStore.delete('oauth_state');

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        return NextResponse.redirect(new URL('/login?error=google_oauth_not_configured', req.url));
    }

    try {
        const origin = new URL(req.url).origin;
        const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${origin}/api/auth/google/callback`;

        // Exchange code for tokens
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            }),
        });

        const tokenData = await tokenRes.json();
        if (tokenData.error) {
            throw new Error(tokenData.error_description || tokenData.error);
        }

        // Get user profile from Google
        const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const profile = await profileRes.json();

        if (!profile.email) {
            throw new Error('Could not retrieve email from Google profile');
        }

        let user: any = null;
        if (process.env.DATABASE_URL) {
            let dbUser = await prisma.user.findUnique({ where: { email: profile.email } });
            if (!dbUser) {
                dbUser = await prisma.user.create({
                    data: {
                        email: profile.email,
                        passwordHash: `google_oauth_${Date.now()}`,
                        name: profile.name || profile.email.split('@')[0],
                        role: 'USER',
                        workspaceId: 1,
                        isVerified: true,
                    },
                });
            } else {
                await prisma.user.update({
                    where: { id: dbUser.id },
                    data: { lastLogin: new Date() },
                });
            }
            user = {
                id: dbUser.id,
                email: dbUser.email,
                name: dbUser.name,
                role: dbUser.role,
                workspace_id: dbUser.workspaceId || 1,
            };
        } else {
            user = db.prepare('SELECT * FROM users WHERE email = ?').get(profile.email) as any;
            if (!user) {
                const result = db.prepare(
                    "INSERT INTO users (email, password_hash, name, role, workspace_id, is_verified) VALUES (?, ?, ?, 'user', 1, 1)"
                ).run(
                    profile.email,
                    `google_oauth_${Date.now()}`,
                    profile.name || profile.email.split('@')[0]
                );
                user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid) as any;
            }
            db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
        }

        // Create JWT session
        const token = await createToken({
            userId: user.id,
            email: user.email,
            role: user.role,
            workspaceId: user.workspace_id || 1,
        });

        // Set cookie
        const cookieStore = cookies();
        cookieStore.set('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        // Redirect based on role
        if (String(user.role).toUpperCase() === 'MASTER' || String(user.role).toUpperCase() === 'ADMIN') {
            return NextResponse.redirect(new URL('/admin', req.url));
        }
        return NextResponse.redirect(new URL('/dashboard', req.url));

    } catch (e: any) {
        console.error('Google OAuth callback error:', e);
        return NextResponse.redirect(
            new URL(`/login?error=${encodeURIComponent(e.message || 'Google sign-in failed')}`, req.url)
        );
    }
}
