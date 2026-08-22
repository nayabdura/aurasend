
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { GmailAccount } from '@/lib/gmail';

export async function POST() {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

        // Get all auth_error accounts for this user (or all if master)
        const accounts: GmailAccount[] = user.role === 'master'
            ? db.prepare("SELECT * FROM gmail_accounts WHERE status = 'auth_error' OR (is_connected = 0 AND status != 'disconnected' AND status != 'deleted')").all() as GmailAccount[]
            : db.prepare("SELECT * FROM gmail_accounts WHERE user_id = ? AND (status = 'auth_error' OR (is_connected = 0 AND status != 'disconnected' AND status != 'deleted'))").all(user.id) as GmailAccount[];

        if (accounts.length === 0) {
            return NextResponse.json({ message: 'No accounts need reconnection.', fixed: 0, failed: 0, needsOAuth: [] });
        }

        let fixed = 0;
        let failed = 0;
        const needsOAuth: string[] = [];

        for (const account of accounts) {
            // Only OAuth accounts have refresh tokens to retry
            if (account.auth_method !== 'oauth') {
                // SMTP / App Password — just re-activate them, credentials are static
                db.prepare("UPDATE gmail_accounts SET status = 'active', is_connected = 1 WHERE id = ?").run(account.id);
                fixed++;
                continue;
            }

            if (!account.refresh_token) {
                needsOAuth.push(account.email);
                continue;
            }

            // Attempt to refresh the token using the stored refresh_token
            try {
                const res = await fetch('https://oauth2.googleapis.com/token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({
                        client_id: account.client_id,
                        client_secret: account.client_secret,
                        refresh_token: account.refresh_token,
                        grant_type: 'refresh_token',
                    }),
                });

                const data = await res.json();

                if (data.error) {
                    // Token is revoked or invalid — needs full re-auth
                    needsOAuth.push(account.email);
                    failed++;
                } else {
                    // Success — update token and mark active
                    const newExpiry = Date.now() + ((data.expires_in || 3600) * 1000);
                    db.prepare(`
                        UPDATE gmail_accounts 
                        SET access_token = ?, expiry_date = ?, status = 'active', is_connected = 1
                        WHERE id = ?
                    `).run(data.access_token, newExpiry, account.id);
                    fixed++;
                }
            } catch (e: any) {
                needsOAuth.push(account.email);
                failed++;
            }
        }

        return NextResponse.json({ fixed, failed, needsOAuth, total: accounts.length });
    } catch (e: any) {
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
