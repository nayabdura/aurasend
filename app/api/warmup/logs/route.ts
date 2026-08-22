import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getEffectiveUserId } from '@/lib/auth';

export async function GET(req: Request) {
    try {
        const userId = await getEffectiveUserId();
        const { searchParams } = new URL(req.url);
        const gmailId = searchParams.get('gmail_id');
        const limit = parseInt(searchParams.get('limit') || '20');

        let query = `
            SELECT wl.*, g.email as gmail_email 
            FROM warmup_logs wl
            LEFT JOIN gmail_accounts g ON wl.gmail_account_id = g.id
        `;
        const conditions: string[] = [];
        const params: any[] = [];

        if (userId) { conditions.push('wl.user_id = ?'); params.push(userId); }
        if (gmailId) { conditions.push('wl.gmail_account_id = ?'); params.push(parseInt(gmailId)); }
        if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
        query += ` ORDER BY wl.timestamp DESC LIMIT ${limit}`;

        const logs = db.prepare(query).all(...params);

        // Stats per account
        const statsQuery = userId
            ? `SELECT gmail_account_id, COUNT(*) as total, 
               SUM(CASE WHEN type='warmup_send' THEN 1 ELSE 0 END) as sent,
               SUM(CASE WHEN type='warmup_reply' THEN 1 ELSE 0 END) as replied
               FROM warmup_logs WHERE user_id = ? GROUP BY gmail_account_id`
            : `SELECT gmail_account_id, COUNT(*) as total,
               SUM(CASE WHEN type='warmup_send' THEN 1 ELSE 0 END) as sent,
               SUM(CASE WHEN type='warmup_reply' THEN 1 ELSE 0 END) as replied
               FROM warmup_logs GROUP BY gmail_account_id`;

        const stats = userId
            ? db.prepare(statsQuery).all(userId)
            : db.prepare(statsQuery).all();

        return NextResponse.json({ logs, stats });
    } catch (e: any) {
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
