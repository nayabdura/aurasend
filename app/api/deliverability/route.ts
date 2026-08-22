import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/deliverability - deliverability stats per account
export async function GET() {
    try {
        const user = await requireAuth();

        const accounts = db.prepare(`
            SELECT 
                g.id, g.email, g.warmup_health_score, g.spam_risk, g.domain_health,
                g.sent_today, g.daily_limit, g.warmup_enabled, g.status,
                g.warmup_day, g.engagement_score,
                COUNT(DISTINCT el.id) as total_sent,
                COUNT(DISTINCT CASE WHEN l.opened = 1 THEN l.id END) as total_opens,
                COUNT(DISTINCT CASE WHEN l.replied = 1 THEN l.id END) as total_replies,
                COUNT(DISTINCT CASE WHEN l.status = 'bounced' THEN l.id END) as total_bounces
            FROM gmail_accounts g
            LEFT JOIN email_logs el ON el.gmail_id = g.id AND el.type = 'sent'
            LEFT JOIN leads l ON el.lead_id = l.id
            WHERE g.user_id = ?
            GROUP BY g.id
        `).all(user.id) as any[];

        // Compute derived metrics
        const enriched = accounts.map(acc => {
            const openRate = acc.total_sent > 0 ? ((acc.total_opens / acc.total_sent) * 100).toFixed(1) : '0.0';
            const replyRate = acc.total_sent > 0 ? ((acc.total_replies / acc.total_sent) * 100).toFixed(1) : '0.0';
            const bounceRate = acc.total_sent > 0 ? ((acc.total_bounces / acc.total_sent) * 100).toFixed(1) : '0.0';

            // Compute spam risk score
            let spamRisk = acc.spam_risk || 0;
            if (parseFloat(bounceRate) > 10) spamRisk = Math.min(100, spamRisk + 30);
            if (parseFloat(replyRate) < 1 && acc.total_sent > 20) spamRisk = Math.min(100, spamRisk + 15);

            // Warmup health classification
            const health = acc.warmup_health_score || 0;
            let healthLabel = 'Poor';
            if (health >= 80) healthLabel = 'Excellent';
            else if (health >= 60) healthLabel = 'Good';
            else if (health >= 40) healthLabel = 'Fair';

            return {
                ...acc,
                openRate,
                replyRate,
                bounceRate,
                spamRisk,
                healthLabel
            };
        });

        // Global stats
        const globalStats = {
            totalAccounts: accounts.length,
            activeAccounts: accounts.filter(a => a.status === 'active').length,
            warmedAccounts: accounts.filter(a => a.warmup_health_score >= 60).length,
            avgHealthScore: accounts.length > 0
                ? Math.round(accounts.reduce((s, a) => s + (a.warmup_health_score || 0), 0) / accounts.length)
                : 0
        };

        return NextResponse.json({ accounts: enriched, globalStats });
    } catch (e: any) {
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
