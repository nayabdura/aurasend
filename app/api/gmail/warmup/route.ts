import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getEffectiveUserId } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const userId = await getEffectiveUserId();
        const { account_id, enabled } = await req.json();

        if (!account_id) {
            return NextResponse.json({ error: 'Missing account_id' }, { status: 400 });
        }

        // Security check
        if (userId) {
            const account = db.prepare('SELECT id FROM gmail_accounts WHERE id = ? AND user_id = ?').get(account_id, userId);
            if (!account) {
                return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
            }
        }

        db.prepare(`UPDATE gmail_accounts SET 
            warmup_enabled = ?, 
            warmup_day = CASE WHEN ? = 1 AND warmup_day = 0 THEN 1 ELSE warmup_day END,
            warmup_health_score = CASE WHEN ? = 1 THEN MAX(warmup_health_score, 30) ELSE warmup_health_score END
            WHERE id = ?`)
            .run(enabled ? 1 : 0, enabled ? 1 : 0, enabled ? 1 : 0, account_id);

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const userId = await getEffectiveUserId();

        let accounts;
        if (userId) {
            accounts = db.prepare(`
                SELECT id, email, name, status, warmup_enabled, warmup_day, warmup_template_id,
                       warmup_sent_today, warmup_health_score, warmup_last_date,
                       sent_today, daily_limit, auth_method, is_connected,
                       warmup_send_start, warmup_send_end
                FROM gmail_accounts WHERE user_id = ?
                ORDER BY email ASC
            `).all(userId) as any[];
        } else {
            accounts = db.prepare(`
                SELECT id, email, name, status, warmup_enabled, warmup_day, warmup_template_id,
                       warmup_sent_today, warmup_health_score, warmup_last_date,
                       sent_today, daily_limit, auth_method, is_connected,
                       warmup_send_start, warmup_send_end
                FROM gmail_accounts
                ORDER BY email ASC
            `).all() as any[];
        }

        // Dynamically compute real health score based on bounces vs sent
        for (const account of accounts) {
            const stats = db.prepare(`
                SELECT 
                    COUNT(*) as total_sent,
                    SUM(CASE WHEN l.status = 'bounced' THEN 1 ELSE 0 END) as total_bounces,
                    SUM(CASE WHEN l.replied = 1 THEN 1 ELSE 0 END) as total_replies
                FROM email_logs el
                JOIN leads l ON el.lead_id = l.id
                WHERE el.gmail_id = ? AND el.type = 'sent'
            `).get(account.id) as any;

            let score = 50; // default medium score
            if (account.warmup_enabled) score += 10;

            if (stats && stats.total_sent > 0) {
                const bounceRate = stats.total_bounces / stats.total_sent;
                const replyRate = stats.total_replies / stats.total_sent;

                // Add up to 30 points for low bounce rate
                score += Math.max(0, 30 - (bounceRate * 100 * 2)); // 15% bounce drops this to 0
                // Add up to 10 points for good reply rate
                score += Math.min(10, replyRate * 100);
            } else if (account.warmup_enabled) {
                // if warming up but no emails sent, gradually go up to 80 based on warmup_day
                score += Math.min(30, account.warmup_day * 2);
            } else {
                score = 30; // Not sending, not warming up
            }

            account.warmup_health_score = Math.floor(Math.min(100, Math.max(0, score)));
            // Update db async
            db.prepare('UPDATE gmail_accounts SET warmup_health_score = ? WHERE id = ?').run(account.warmup_health_score, account.id);
        }

        return NextResponse.json(accounts);
    } catch (e: any) {
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
