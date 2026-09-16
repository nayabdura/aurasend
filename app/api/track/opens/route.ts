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

        let opens: any[] = [];
        let accountStats: any[] = [];
        let totals: any = { total_sent: 0, total_opened: 0, total_replied: 0 };

        if (process.env.DATABASE_URL) {
            const prisma = (await import('@/lib/prisma')).default;
            const isMaster = ['MASTER', 'ADMIN'].includes(String(user.role || '').toUpperCase());
            const where: any = isMaster ? { OR: [{ opened: true }, { replied: true }] } : { userId: user.id, OR: [{ opened: true }, { replied: true }] };

            const openedLeads = await prisma.lead.findMany({
                where,
                include: { campaign: true },
                take: limit,
            });

            opens = openedLeads.map((l) => ({
                lead_id: l.id,
                lead_email: l.email,
                lead_name: l.name,
                company: l.company,
                opened_at: l.openedAt ? Number(l.openedAt) : (l.repliedAt ? Number(l.repliedAt) : Date.now()),
                sent_at: l.sentAt ? Number(l.sentAt) : Date.now(),
                campaign_id: l.campaignId,
                replied: l.replied ? 1 : 0,
                status: l.status,
                campaign_name: l.campaign?.name || 'Standard Outreach',
                gmail_id: null,
                sender_email: 'Outreach Mailbox',
                sender_name: 'Outreach',
            }));

            const gmailAccountsList = await prisma.gmailAccount.findMany({
                where: isMaster ? {} : { userId: user.id },
            });

            accountStats = gmailAccountsList.map((g) => ({
                id: g.id,
                email: g.email,
                name: g.name,
                opens: openedLeads.length,
                replies: openedLeads.filter((l) => l.replied).length,
            }));

            const totalSentCount = await prisma.emailLog.count({
                where: isMaster ? { type: 'sent' } : { userId: user.id, type: 'sent' }
            }).catch(() => 0);

            const totalOpenedCount = await prisma.lead.count({
                where: isMaster ? { opened: true } : { userId: user.id, opened: true }
            }).catch(() => 0);

            const totalRepliedCount = await prisma.lead.count({
                where: isMaster ? { replied: true } : { userId: user.id, replied: true }
            }).catch(() => 0);

            totals = {
                total_sent: totalSentCount,
                total_opened: totalOpenedCount,
                total_replied: totalRepliedCount,
            };
        } else {
            let sinceFilter = '';
            const params: any[] = [user.id];
            if (since) {
                sinceFilter = 'AND l.opened_at > ?';
                params.push(parseInt(since));
            }

            opens = db.prepare(`
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

            accountStats = db.prepare(`
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

            totals = db.prepare(`
                SELECT
                    COUNT(CASE WHEN sent_at > 0 OR status != 'pending' THEN 1 END) AS total_sent,
                    SUM(CASE WHEN opened = 1 THEN 1 ELSE 0 END) AS total_opened,
                    SUM(CASE WHEN replied = 1 THEN 1 ELSE 0 END) AS total_replied
                FROM leads
                WHERE user_id = ?
            `).get(user.id) as any;
        }

        const seen = new Map<number, any>();
        for (const row of opens) {
            if (!seen.has(row.lead_id) || row.sender_email) {
                seen.set(row.lead_id, row);
            }
        }
        const unique = Array.from(seen.values());

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
