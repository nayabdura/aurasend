import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import db from '@/lib/db';

// GET /api/warmup/activity — all warmup send logs for the current user
export async function GET(request: Request) {
    try {
        const user = await requireAuth();
        const url = new URL(request.url);
        const accountId = url.searchParams.get('accountId');
        const limit = parseInt(url.searchParams.get('limit') || '100');

        let query = `
            SELECT
                wl.id,
                wl.gmail_account_id,
                wl.subject,
                wl.type,
                wl.timestamp,
                wl.to_email,
                g.email AS account_email,
                g.warmup_health_score,
                g.warmup_sent_today,
                g.warmup_day
            FROM warmup_logs wl
            LEFT JOIN gmail_accounts g ON wl.gmail_account_id = g.id
            WHERE g.user_id = ?
        `;
        const params: any[] = [user.id];

        if (accountId) {
            query += ' AND wl.gmail_account_id = ?';
            params.push(parseInt(accountId));
        }

        query += ' ORDER BY wl.timestamp DESC LIMIT ?';
        params.push(limit);

        const logs = db.prepare(query).all(...params) as any[];

        // Per-account summary stats
        const accountStats = db.prepare(`
            SELECT 
                g.id,
                g.email,
                g.warmup_enabled,
                g.warmup_day,
                g.warmup_health_score,
                g.warmup_sent_today,
                g.warmup_last_date,
                COUNT(wl.id) AS total_warmup_sent,
                MAX(wl.timestamp) AS last_warmup_at
            FROM gmail_accounts g
            LEFT JOIN warmup_logs wl ON wl.gmail_account_id = g.id
            WHERE g.user_id = ?
            GROUP BY g.id
            ORDER BY last_warmup_at DESC
        `).all(user.id) as any[];

        return NextResponse.json({ logs, accountStats });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
