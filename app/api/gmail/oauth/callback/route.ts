import { getTokens } from '@/lib/gmail';
import db from '@/lib/db';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { eventBus } from '@/lib/events';
import { encryptSecret } from '@/lib/crypto';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    if (error) {
        const errorMsg = error === 'access_denied' ? 'OAuth access denied. Please verify your Google authorization and try again.' : error;
        return NextResponse.redirect(new URL('/gmail?error=' + encodeURIComponent(errorMsg), req.url));
    }

    if (!code || !state) {
        return NextResponse.redirect(new URL('/gmail?error=missing_code_or_state', req.url));
    }

    // Decode state: base64(userId:email:csrfToken)
    let email = '';
    let parsedUserId: number | null = null;
    let csrfTokenFromState = '';
    try {
        const decoded = Buffer.from(state, 'base64').toString('utf-8');
        const parts = decoded.split(':');
        parsedUserId = parseInt(parts[0], 10);
        csrfTokenFromState = parts[parts.length - 1];
        email = parts.slice(1, parts.length - 1).join(':');
    } catch (e) {
        return NextResponse.redirect(new URL('/gmail?error=invalid_state', req.url));
    }

    if (!parsedUserId || !email || !csrfTokenFromState) {
        return NextResponse.redirect(new URL('/gmail?error=invalid_state_data', req.url));
    }

    // CSRF verification
    const { cookies } = require('next/headers');
    const cookieStore = cookies();
    const storedCsrfToken = cookieStore.get('gmail_oauth_csrf')?.value;

    if (!storedCsrfToken || storedCsrfToken !== csrfTokenFromState) {
        cookieStore.delete('gmail_oauth_csrf');
        return NextResponse.redirect(new URL('/gmail?error=csrf_validation_failed', req.url));
    }

    // Clear the token after successful validation
    cookieStore.delete('gmail_oauth_csrf');

    // Ensure the user is logged in
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.redirect(new URL('/login?error=oauth_session_expired', req.url));
    }

    // Find the account for this user
    let account: any = null;
    if (process.env.DATABASE_URL) {
        account = await prisma.gmailAccount.findFirst({
            where: { email, userId: parsedUserId }
        });
    } else {
        account = db.prepare('SELECT * FROM gmail_accounts WHERE email = ? AND user_id = ?').get(email, parsedUserId) as any;
    }

    if (!account) {
        return NextResponse.redirect(new URL('/gmail?error=account_not_found_or_access_denied', req.url));
    }

    const clientId = account.clientId || account.client_id || process.env.GOOGLE_CLIENT_ID;
    const clientSecret = account.clientSecret || account.client_secret || process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        return NextResponse.redirect(new URL('/gmail?error=missing_oauth_credentials', req.url));
    }

    try {
        const origin = new URL(req.url).origin;
        const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${origin}/api/gmail/oauth/callback`;
        const tokens = await getTokens(code, clientId, clientSecret, redirectUri);

        const expiryDate = Date.now() + ((tokens.expires_in || 3600) * 1000);

        if (process.env.DATABASE_URL) {
            await prisma.gmailAccount.update({
                where: { id: account.id },
                data: {
                    accessTokenEncrypted: encryptSecret(tokens.access_token),
                    refreshTokenEncrypted: tokens.refresh_token ? encryptSecret(tokens.refresh_token) : account.refreshTokenEncrypted,
                    expiryDate: BigInt(expiryDate),
                    status: 'active',
                    isConnected: true,
                },
            });
        } else {
            db.prepare(`
                UPDATE gmail_accounts 
                SET access_token = ?, 
                    refresh_token = COALESCE(?, refresh_token), 
                    expiry_date = ?, 
                    status = 'active', 
                    is_connected = 1
                WHERE id = ? AND user_id = ?
            `).run(tokens.access_token, tokens.refresh_token, expiryDate, account.id, parsedUserId);
        }

        eventBus.emitEvent('GMAIL_CONNECTED', parsedUserId, { email: account.email });

        return NextResponse.redirect(new URL('/gmail?success=connected', req.url));

    } catch (err: any) {
        console.error('OAuth callback error:', err);
        const msg = encodeURIComponent(err.message || 'OAuth token exchange failed');
        return NextResponse.redirect(new URL(`/gmail?error=${msg}`, req.url));
    }
}
