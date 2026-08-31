import { NextResponse } from 'next/server';
import db from '@/lib/db';
import prisma from '@/lib/prisma';
import { getAuthUrl } from '@/lib/gmail';
import { getUserId } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const userId = await getUserId();
        const body = await req.json();
        const { email, name, clientId, clientSecret, dailyLimit } = body;

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const finalClientId = clientId || process.env.GOOGLE_CLIENT_ID;
        const finalClientSecret = clientSecret || process.env.GOOGLE_CLIENT_SECRET;

        if (!finalClientId || !finalClientSecret) {
            return NextResponse.json({ error: 'Google OAuth Client ID and Secret are missing. Please provide them or set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in the environment variables.' }, { status: 400 });
        }

        // Upsert Gmail Account
        if (process.env.DATABASE_URL) {
            await prisma.gmailAccount.upsert({
                where: { userId_email: { userId, email } },
                update: {
                    clientId: finalClientId,
                    clientSecret: finalClientSecret,
                    authMethod: 'oauth',
                    dailyLimit: dailyLimit || 20,
                    status: 'pending_auth',
                    isConnected: false,
                    name: name || undefined,
                },
                create: {
                    userId,
                    email,
                    name: name || email.split('@')[0],
                    clientId: finalClientId,
                    clientSecret: finalClientSecret,
                    authMethod: 'oauth',
                    dailyLimit: dailyLimit || 20,
                    status: 'pending_auth',
                    isConnected: false,
                    workspaceId: 1,
                },
            });
        } else {
            const existing = db.prepare('SELECT * FROM gmail_accounts WHERE user_id = ? AND email = ?').get(userId, email);
            if (existing) {
                db.prepare(`
                    UPDATE gmail_accounts 
                    SET client_id = ?, client_secret = ?, auth_method = 'oauth', daily_limit = ?,
                        status = 'pending_auth', is_connected = 0,
                        name = COALESCE(NULLIF(?, ''), name)
                    WHERE user_id = ? AND email = ?
                `).run(finalClientId, finalClientSecret, dailyLimit || 20, name || '', userId, email);
            } else {
                db.prepare(`
                    INSERT INTO gmail_accounts (
                        user_id, email, name, client_id, client_secret, 
                        auth_method, daily_limit, status
                    ) VALUES (?, ?, ?, ?, ?, 'oauth', ?, 'pending_auth')
                `).run(userId, email, name || '', finalClientId, finalClientSecret, dailyLimit || 20);
            }
        }

        // Generate Auth URL
        const { getAppBaseUrl } = require('@/backend/utils/url');
        const baseUrl = getAppBaseUrl(req);
        const redirectUri = process.env.GOOGLE_GMAIL_REDIRECT_URI || `${baseUrl}/api/gmail/oauth/callback`;
        const authUrl = await getAuthUrl(finalClientId, redirectUri);

        // Generate CSRF token for state
        const crypto = require('crypto');
        const csrfToken = crypto.randomBytes(16).toString('hex');

        // State format: base64(userId:email:csrfToken)
        const state = Buffer.from(`${userId}:${email}:${csrfToken}`).toString('base64');
        const finalUrl = `${authUrl}&state=${encodeURIComponent(state)}`;

        // Set CSRF token in cookie
        const { cookies } = require('next/headers');
        cookies().set('gmail_oauth_csrf', csrfToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 10, // 10 minutes
        });

        return NextResponse.json({ url: finalUrl });
    } catch (error: any) {
        console.error('Gmail OAuth add error:', error);
        return NextResponse.json({
            error: error.message || 'Internal Server Error'
        }, { status: 500 });
    }
}
