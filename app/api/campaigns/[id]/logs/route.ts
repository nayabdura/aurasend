import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import db from '@/lib/db';

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const user = await requireAuth();
        const campaignId = parseInt(params.id);

        // Validate campaign belongs to user
        const campaign = db.prepare(
            'SELECT * FROM campaigns WHERE id = ? AND (user_id = ? OR ? = ?)'
        ).get(campaignId, user.id, user.role, 'master') as any;

        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }

        // Get all leads for this campaign with full send details
        const leads = db.prepare(`
            SELECT 
                l.id,
                l.email,
                l.name,
                l.company,
                l.status,
                l.sent_at,
                l.last_sent_at,
                l.followup1_sent_at,
                l.followup2_sent_at,
                l.opened,
                l.opened_at,
                l.replied,
                l.replied_at,
                l.follow_up_count,
                l.is_valid,
                el.gmail_id,
                g.email AS sender_email,
                el.type AS log_type,
                el.timestamp AS log_timestamp,
                el.message_id
            FROM leads l
            LEFT JOIN email_logs el ON el.lead_id = l.id
            LEFT JOIN gmail_accounts g ON el.gmail_id = g.id
            WHERE l.campaign_id = ?
            ORDER BY COALESCE(l.sent_at, 0) DESC, l.id DESC
        `).all(campaignId) as any[];

        // Deduplicate: one row per lead (take the most recent log)
        const leadsMap = new Map<number, any>();
        for (const row of leads) {
            if (!leadsMap.has(row.id)) {
                leadsMap.set(row.id, row);
            }
        }
        const uniqueLeads = Array.from(leadsMap.values());

        // Stats summary
        const stats = {
            total: uniqueLeads.length,
            sent: uniqueLeads.filter(l => l.sent_at).length,
            pending: uniqueLeads.filter(l => !l.sent_at && l.status === 'pending').length,
            opened: uniqueLeads.filter(l => l.opened).length,
            replied: uniqueLeads.filter(l => l.replied).length,
            bounced: uniqueLeads.filter(l => l.status === 'bounced').length,
            unsubscribed: uniqueLeads.filter(l => l.status === 'unsubscribed').length,
        };

        return NextResponse.json({ campaign, leads: uniqueLeads, stats });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
