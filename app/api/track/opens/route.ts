import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import db from '@/lib/db';

// GET /api/track/opens — fetch recent email open events with full context
export async function GET(request: Request) {
    try {
        const user = await requireAuth();
        const url = new URL(request.url);
        const limit = parseInt(url.searchParams.get('limit') || '200');
        const since = url.searchParams.get('since'); // unix ms timestamp for polling

        let sinceFilter = '';
        const params: any[] = [user.id];
        if (since) {
            sinceFilter = 'AND l.opened_at > ?';
            params.push(parseInt(since));
        }

        // Fetch all opened leads for this user
        const opens = db.prepare(`
            SELECT
                l.id AS lead_id,
                l.email AS lead_email,
                l.name AS lead_name,
                l.company,
                COALESCE(l.opened_at, l.replied_at) AS opened_at,
                l.sent_at,
                l.campaign_id,
                l.replied,
                l.status,
                c.name AS campaign_name,
                -- Find which gmail account sent to this lead
                el.gmail_id,
                g.email AS sender_email,
                g.name AS sender_name
            FROM leads l
            LEFT JOIN campaigns c ON l.campaign_id = c.id
            LEFT JOIN email_logs el ON el.lead_id = l.id AND el.type = 'sent'
            LEFT JOIN gmail_accounts g ON el.gmail_id = g.id
            WHERE l.user_id = ?
              AND (l.opened = 1 OR l.replied = 1)
              ${sinceFilter}
            ORDER BY COALESCE(l.opened_at, l.replied_at) DESC
            LIMIT ?
        `).all(...params, limit) as any[];

        // Deduplicate by lead_id (take the one with sender info)
        const seen = new Map<number, any>();
        for (const row of opens) {
            if (!seen.has(row.lead_id) || row.sender_email) {
                seen.set(row.lead_id, row);
            }
        }
        const unique = Array.from(seen.values());

        // Summary stats per account
        const accountStats = db.prepare(`
            SELECT
                g.id,
                g.email,
                g.name,
                COUNT(DISTINCT CASE WHEN l.opened = 1 THEN l.id END) AS opens,
                COUNT(DISTINCT CASE WHEN l.replied = 1 THEN l.id END) AS replies
            FROM gmail_accounts g
            LEFT JOIN email_logs el ON el.gmail_id = g.id AND el.type = 'sent'
            LEFT JOIN leads l ON el.lead_id = l.id
            WHERE g.user_id = ?
            GROUP BY g.id
            ORDER BY opens DESC
        `).all(user.id) as any[];

        // Total stats
        const totals = db.prepare(`
            SELECT
                COUNT(CASE WHEN sent_at > 0 OR status != 'pending' THEN 1 END) AS total_sent,
                SUM(CASE WHEN opened = 1 THEN 1 ELSE 0 END) AS total_opened,
                SUM(CASE WHEN replied = 1 THEN 1 ELSE 0 END) AS total_replied
            FROM leads
            WHERE user_id = ?
        `).get(user.id) as any;

        return NextResponse.json({
            opens: unique,
            accountStats,
            totals,
            generatedAt: Date.now()
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
