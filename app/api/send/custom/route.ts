import { NextResponse } from 'next/server';
import { sendEmailViaGmail } from '@/lib/gmail';
import { verifyEmail } from '@/lib/verification';
import db from '@/lib/db';
import { getEffectiveUserId } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const userId = await getEffectiveUserId();
        const { to, subject, body } = await req.json();

        if (!to || !subject || !body) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Verify Email
        const verification = await verifyEmail(to);
        if (!verification.isValid) {
            return NextResponse.json({
                success: false,
                error: `Verification Failed: ${verification.reason}`
            }, { status: 400 });
        }

        // 2. Get Account
        let account;
        if (userId) {
            account = db.prepare("SELECT * FROM gmail_accounts WHERE is_connected = 1 AND status = 'active' AND user_id = ? LIMIT 1").get(userId) as any;
        } else {
            account = db.prepare("SELECT * FROM gmail_accounts WHERE is_connected = 1 AND status = 'active' LIMIT 1").get() as any;
        }

        if (!account) {
            return NextResponse.json({ error: 'No active Gmail account connected for this user' }, { status: 400 });
        }

        // 3. Send
        await sendEmailViaGmail(account, to, subject, body);

        return NextResponse.json({ success: true, message: 'Email sent successfully' });
    } catch (error: any) {
        console.error('Send custom email error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to send email'
        }, { status: 500 });
    }
}
