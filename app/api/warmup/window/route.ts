import { NextResponse } from 'next/server';
import { getUserId, getEffectiveUserId } from '@/lib/auth';
import db from '@/lib/db';

// PATCH /api/warmup/window — update the sending time window for an account
export async function PATCH(req: Request) {
    try {
        const userId = await getEffectiveUserId();
        const { account_id, start_time, end_time } = await req.json();

        if (!account_id || !start_time || !end_time) {
            return NextResponse.json({ error: 'account_id, start_time, end_time are required' }, { status: 400 });
        }

        // Validate HH:MM format
        const timeRe = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRe.test(start_time) || !timeRe.test(end_time)) {
            return NextResponse.json({ error: 'Times must be in HH:MM format (e.g. 08:00)' }, { status: 400 });
        }

        let result;
        if (userId) {
            result = db.prepare(`
                UPDATE gmail_accounts 
                SET warmup_send_start = ?, warmup_send_end = ?
                WHERE id = ? AND user_id = ?
            `).run(start_time, end_time, account_id, userId);
        } else {
            result = db.prepare(`
                UPDATE gmail_accounts 
                SET warmup_send_start = ?, warmup_send_end = ?
                WHERE id = ?
            `).run(start_time, end_time, account_id);
        }

        if (result.changes === 0) {
            return NextResponse.json({ error: 'Account not found or not yours' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
