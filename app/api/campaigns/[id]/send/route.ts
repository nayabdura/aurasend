import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import db from '@/lib/db';
import { enqueueSend } from '@/lib/queue';

// POST /api/campaigns/[id]/send — manually trigger sending for a specific campaign
export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const user = await requireAuth();
        const campaignId = parseInt(params.id);

        // Validate campaign ownership
        const campaign = user.role === 'master'
            ? db.prepare('SELECT * FROM campaigns WHERE id = ?').get(campaignId) as any
            : db.prepare('SELECT * FROM campaigns WHERE id = ? AND user_id = ?').get(campaignId, user.id) as any;

        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }

        // Get assigned accounts for THIS campaign only
        // For manual send, allow accounts that are connected even if status='paused'
        const accounts = db.prepare(`
            SELECT ga.* FROM gmail_accounts ga 
            JOIN campaign_accounts ca ON ga.id = ca.gmail_account_id 
            WHERE ca.campaign_id = ? AND ga.is_connected = 1
              AND ga.status IN ('active', 'paused')
        `).all(campaignId) as any[];

        if (accounts.length === 0) {
            return NextResponse.json({ error: 'No active Gmail accounts assigned to this campaign. Please edit the campaign and select accounts.' }, { status: 400 });
        }

        // Get template
        if (!campaign.template_id) {
            return NextResponse.json({ error: 'No template assigned to this campaign. Please edit the campaign and select a template.' }, { status: 400 });
        }

        const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(campaign.template_id) as any;
        if (!template) {
            return NextResponse.json({ error: `Template #${campaign.template_id} not found.` }, { status: 400 });
        }

        // Filter accounts that still have quota
        const validAccounts = accounts.filter((a: any) => a.sent_today < a.daily_limit);
        if (validAccounts.length === 0) {
            return NextResponse.json({ error: 'All assigned accounts have reached their daily send limit.' }, { status: 400 });
        }

        // Get pending leads for this campaign
        const pendingLeads = db.prepare(`
            SELECT * FROM leads 
            WHERE campaign_id = ? AND status = 'pending' AND is_valid = 1
            ORDER BY id ASC
            LIMIT 100
        `).all(campaignId) as any[];

        if (pendingLeads.length === 0) {
            // Check if there are any leads at all
            const totalLeads = (db.prepare('SELECT COUNT(*) as c FROM leads WHERE campaign_id = ?').get(campaignId) as any).c;
            if (totalLeads === 0) {
                return NextResponse.json({ error: 'No leads uploaded to this campaign. Please go to Edit and upload a CSV.' }, { status: 400 });
            }
            return NextResponse.json({
                success: true,
                message: 'No pending leads to send. All leads have already been sent or are not valid.',
                counts: { sent: totalLeads, pending: 0 }
            });
        }

        // Assign A/B template
        const templateB = campaign.template_id_b
            ? db.prepare('SELECT * FROM templates WHERE id = ?').get(campaign.template_id_b)
            : null;

        let sent = 0;
        let errors = 0;
        let accountIdx = 0;

        // Distribute leads across valid accounts (round-robin)
        for (const lead of pendingLeads) {
            const account = validAccounts[accountIdx % validAccounts.length];
            if (account.sent_today >= account.daily_limit) {
                accountIdx++;
                if (accountIdx >= validAccounts.length) break; // All accounts full
                continue;
            }

            // Lock the lead atomically
            const lock = db.prepare("UPDATE leads SET status = 'processing_queue' WHERE id = ? AND status = 'pending'").run(lead.id);
            if (lock.changes === 0) continue; // Another process got it

            // Choose template (A/B split)
            const chosenTemplateId = (templateB && Math.random() > 0.5)
                ? (templateB as any).id
                : campaign.template_id;

            try {
                await enqueueSend({
                    leadId: lead.id,
                    accountId: account.id,
                    campaignId,
                    templateId: chosenTemplateId,
                });
                // Update local sent_today count to track the limit
                account.sent_today++;
                sent++;
            } catch (e: any) {
                console.error(`Send error for lead ${lead.id}:`, e.message);
                errors++;
                // Reset the lead back if it failed
                db.prepare("UPDATE leads SET status = 'pending' WHERE id = ? AND status = 'processing_queue'").run(lead.id);
            }

            accountIdx++;
        }

        // Fetch updated counts
        const counts = db.prepare(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'bounced' THEN 1 ELSE 0 END) as bounced
            FROM leads WHERE campaign_id = ?
        `).get(campaignId) as any;

        return NextResponse.json({
            success: true,
            message: `Sent ${sent} email${sent !== 1 ? 's' : ''} via ${validAccounts.length} account${validAccounts.length !== 1 ? 's' : ''}${errors > 0 ? ` (${errors} errors)` : ''}`,
            counts,
            accounts_used: validAccounts.map((a: any) => a.email),
        });

    } catch (error: any) {
        console.error('Manual send error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
