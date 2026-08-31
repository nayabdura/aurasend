import { NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/gmail';
import prisma from '@/lib/prisma';
import db from '@/lib/db';
import { getAppBaseUrl } from '@/backend/utils/url';

export async function POST(req: Request) {
    const formData = await req.formData();
    const email = formData.get('email') as string;

    let account: any = null;
    if (process.env.DATABASE_URL) {
        account = await prisma.gmailAccount.findFirst({ where: { email } });
    } else {
        account = db.prepare('SELECT * FROM gmail_accounts WHERE email = ?').get(email) as any;
    }

    if (!account) return NextResponse.redirect(new URL('/gmail?error=Account not found', req.url));

    const baseUrl = getAppBaseUrl(req);
    const redirectUri = process.env.GOOGLE_GMAIL_REDIRECT_URI || `${baseUrl}/api/gmail/oauth/callback`;
    const clientId = account.clientId || account.client_id || process.env.GOOGLE_CLIENT_ID;

    const url = await getAuthUrl(clientId, redirectUri);
    const finalUrl = `${url}&state=${encodeURIComponent(email)}`;

    return NextResponse.redirect(finalUrl);
}
