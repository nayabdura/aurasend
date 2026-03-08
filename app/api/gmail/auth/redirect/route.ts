
import { NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/gmail';
import db from '@/lib/db';

export async function POST(req: Request) {
    const formData = await req.formData();
    const email = formData.get('email') as string;

    const account = db.prepare('SELECT * FROM gmail_accounts WHERE email = ?').get(email) as any;
    if (!account) return NextResponse.redirect(new URL('/gmail?error=Account not found', req.url));

    const redirectUri = 'http://localhost:3000/api/gmail/oauth/callback';
    const url = await getAuthUrl(account.client_id, redirectUri);
    // Manual state injection if getAuthUrl didn't accept it, but my impl did in `lib/gmail.ts`? 
    // Wait, I didn't update `getAuthUrl` to accept `state`. I need to fix that or append manually.
    // In step 48 I implemented getAuthUrl without state param in function signature but not in body.
    // Let's check `lib/gmail.ts`... `getAuthUrl` signature: (clientId, redirectUri).
    // So I must append state manually here.

    const finalUrl = `${url}&state=${encodeURIComponent(email)}`;

    return NextResponse.redirect(finalUrl);
}
