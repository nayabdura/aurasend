import { processQueue } from '@/lib/gmail';
import db from '@/lib/db';
import { NextResponse } from 'next/server';
import { getEffectiveUserId } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const userId = await getEffectiveUserId();
        const { email } = await req.json(); // Admin email to send to
        if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 });

        let account;
        if (userId) {
            account = db.prepare("SELECT * FROM gmail_accounts WHERE status = 'active' AND is_connected = 1 AND user_id = ? LIMIT 1").get(userId);
        } else {
            account = db.prepare("SELECT * FROM gmail_accounts WHERE status = 'active' AND is_connected = 1 LIMIT 1").get();
        }

        if (!account) return NextResponse.json({ error: 'No active Gmail connected for this user' }, { status: 400 });

        // Send Test Email
        const result = await processQueue(true, email, userId);

        return NextResponse.json({ success: true, result });
    } catch (e: any) {
        return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
    }
}
