import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { decryptSecret, encryptSecret } from '@/lib/crypto';

export async function POST() {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

        const isMaster = ['MASTER', 'ADMIN'].includes(String(user.role || '').toUpperCase());

        // Get all auth_error accounts for this user (or all if master)
        const accounts = await prisma.gmailAccount.findMany({
            where: {
                ...(isMaster ? {} : { userId: user.id }),
                OR: [
                    { status: 'auth_error' },
                    {
                        isConnected: false,
                        status: { notIn: ['disconnected', 'deleted'] }
                    }
                ]
            }
        });

        if (accounts.length === 0) {
            return NextResponse.json({ message: 'No accounts need reconnection.', fixed: 0, failed: 0, needsOAuth: [] });
        }

        let fixed = 0;
        let failed = 0;
        const needsOAuth: string[] = [];

        for (const account of accounts) {
            // Only OAuth accounts have refresh tokens to retry
            if (account.authMethod !== 'oauth') {
                // SMTP / App Password — just re-activate them
                await prisma.gmailAccount.update({
                    where: { id: account.id },
                    data: { status: 'active', isConnected: true }
                });
                fixed++;
                continue;
            }

            const refreshToken = account.refreshTokenEncrypted ? decryptSecret(account.refreshTokenEncrypted) : null;

            if (!refreshToken || !account.clientId || !account.clientSecret) {
                needsOAuth.push(account.email);
                continue;
            }

            // Attempt to refresh the token using stored refresh_token
            try {
                const res = await fetch('https://oauth2.googleapis.com/token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({
                        client_id: account.clientId,
                        client_secret: account.clientSecret,
                        refresh_token: refreshToken,
                        grant_type: 'refresh_token',
                    }),
                });

                const data = await res.json();

                if (data.error) {
                    needsOAuth.push(account.email);
                    failed++;
                } else {
                    const newExpiry = BigInt(Date.now() + ((data.expires_in || 3600) * 1000));
                    const newAccessTokenEncrypted = encryptSecret(data.access_token);

                    await prisma.gmailAccount.update({
                        where: { id: account.id },
                        data: {
                            accessTokenEncrypted: newAccessTokenEncrypted,
                            expiryDate: newExpiry,
                            status: 'active',
                            isConnected: true,
                        }
                    });
                    fixed++;
                }
            } catch (e: any) {
                needsOAuth.push(account.email);
                failed++;
            }
        }

        return NextResponse.json({ fixed, failed, needsOAuth, total: accounts.length });
    } catch (e: any) {
        console.error('[retry-auth] Error:', e);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
