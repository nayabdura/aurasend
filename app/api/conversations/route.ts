import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/conversations - list reply threads
export async function GET(req: Request) {
    try {
        const user = await requireAuth();
        const { searchParams } = new URL(req.url);
        const unreadOnly = searchParams.get('unread') === 'true';

        let query = `
            SELECT r.*, g.email as from_account
            FROM reply_threads r
            LEFT JOIN gmail_accounts g ON r.gmail_account_id = g.id
            WHERE r.user_id = ?
        `;

        if (unreadOnly) query += ' AND r.is_read = 0';
        query += ' ORDER BY r.last_message_date DESC LIMIT 50';

        const threads = db.prepare(query).all(user.id);
        const unreadCount = (db.prepare(
            'SELECT COUNT(*) as c FROM reply_threads WHERE user_id = ? AND is_read = 0'
        ).get(user.id) as any)?.c || 0;

        return NextResponse.json({ threads, unreadCount });
    } catch (e: any) {
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
