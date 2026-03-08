
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getEffectiveUserId } from '@/lib/auth';

export async function GET() {
    try {
        const userId = await getEffectiveUserId();

        // Build query with optional user filter
        const filter = userId ? 'AND user_id = ?' : '';
        const args = userId ? [userId] : [];

        const totals = db.prepare(`
            SELECT 
                COUNT(CASE WHEN sent_at > 0 OR status != 'pending' THEN 1 END) as total_sent,
                SUM(CASE WHEN opened = 1 THEN 1 ELSE 0 END) as total_opened,
                SUM(CASE WHEN replied = 1 THEN 1 ELSE 0 END) as total_replied,
                SUM(CASE WHEN status = 'bounced' THEN 1 ELSE 0 END) as total_bounced,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'invalid' THEN 1 ELSE 0 END) as invalid
            FROM leads
            ${userId ? 'WHERE user_id = ?' : ''}
        `).get(...args) as any || { total_sent: 0, total_opened: 0, total_replied: 0, total_bounced: 0, pending: 0, invalid: 0 };

        const totalSent = totals.total_sent || 0;
        const totalOpened = totals.total_opened || 0;
        const totalReplied = totals.total_replied || 0;
        const totalBounced = totals.total_bounced || 0;
        const pending = totals.pending || 0;
        const invalid = totals.invalid || 0;

        // This 'sent' is exclusively those currently in 'sent' status.
        const sent = (db.prepare(`SELECT COUNT(*) as count FROM leads WHERE status = 'sent' ${filter}`).get(...args) as any).count;
        const bounced = totalBounced;

        // Email sends per day (last 7 days)
        const dailyFilter = userId ? 'WHERE user_id = ?' : '';
        const daily = db.prepare(`
            SELECT DATE(timestamp, 'unixepoch') as date, COUNT(*) as count
            FROM email_logs
            ${dailyFilter}
            GROUP BY DATE(timestamp, 'unixepoch')
            ORDER BY date DESC
            LIMIT 7
        `).all(...args) as any[];

        return NextResponse.json({
            total_sent: totalSent,
            total_opened: totalOpened,
            total_replied: totalReplied,
            total_bounced: totalBounced,
            pending,
            sent,
            invalid,
            bounced,
            daily_sends: daily.reverse()
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
