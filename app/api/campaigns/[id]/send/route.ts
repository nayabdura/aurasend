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

        let delaySeconds = 0;
        try {
            const body = await request.clone().json();
            delaySeconds = Number(body.delaySeconds) || 0;
        } catch (e) { }

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

        // Get template or fallback for Gemini AI
        let template = campaign.template_id ? db.prepare('SELECT * FROM templates WHERE id = ?').get(campaign.template_id) as any : null;
        if (!template) {
            template = db.prepare('SELECT * FROM templates ORDER BY id ASC LIMIT 1').get() as any || {
                id: 0,
                name: 'Gemini AI Auto-Generated',
                subject: 'Quick question for {{first_name}}',
                body: 'Hi {{first_name}},\n\nI came across your profile at {{company}}...'
            };
        }

        // Filter accounts that still have quota
        const validAccounts = accounts.filter((a: any) => a.sent_today < a.daily_limit);
        if (validAccounts.length === 0) {
            return NextResponse.json({ error: 'All assigned accounts have reached their daily send limit.' }, { status: 400 });
        }

        // Allow is_valid = 1 (verified valid) OR is_valid IS NULL (not yet verified).
        // Only hard-block is_valid = 0 (confirmed invalid: disposable, disabled mailbox, etc.)
        const pendingLeads = db.prepare(`
            SELECT * FROM leads 
            WHERE campaign_id = ? AND status = 'pending' AND (is_valid = 1 OR is_valid IS NULL)
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

        // Distribute leads across valid accounts (round-robin)
        const processSends = async () => {
            let sent = 0;
            let errors = 0;
            
            // ── Phase 1: Pre-allocate & Lock Synchronously ───────────────────
            // We must lock all the leads we intend to send upfront so that if 
            // the cron job restarts while we are sleeping in Phase 2, the cron 
            // will not pick up these same leads and double-send.
            const leadsToProcess: { lead: any, account: any }[] = [];
            
            db.transaction(() => {
                let accountIdx = 0;
                for (let i = 0; i < pendingLeads.length; i++) {
                    const lead = pendingLeads[i];
                    
                    // Find an account with capacity
                    let account = validAccounts[accountIdx % validAccounts.length];
                    let attempts = 0;
                    while (account.sent_today >= account.daily_limit && attempts < validAccounts.length) {
                        accountIdx++;
                        account = validAccounts[accountIdx % validAccounts.length];
                        attempts++;
                    }
                    
                    if (account.sent_today >= account.daily_limit) {
                        break; // All accounts full
                    }

                    // Lock the lead atomically
                    const lock = db.prepare("UPDATE leads SET status = 'processing_queue' WHERE id = ? AND status = 'pending'").run(lead.id);
                    if (lock.changes > 0) {
                        leadsToProcess.push({ lead, account });
                        account.sent_today++; // Reserve the quota
                        accountIdx++;
                    }
                }
            })();

            // ── Phase 2: Asynchronous Sending with Delays ────────────────────
            for (let i = 0; i < leadsToProcess.length; i++) {
                const { lead, account } = leadsToProcess[i];

                // Sleep for gap delay between emails (skip for the first one)
                if (i > 0 && delaySeconds > 0) {
                    await new Promise(r => setTimeout(r, delaySeconds * 1000));
                }

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
                    sent++;
                } catch (e: any) {
                    console.error(`Send error for lead ${lead.id}:`, e.message);
                    errors++;
                    // Reset the lead back if it failed
                    db.prepare("UPDATE leads SET status = 'pending' WHERE id = ?").run(lead.id);
                    // Give back the quota
                    account.sent_today--;
                }
            }

            return { sent, errors };
        };

        if (delaySeconds > 0) {
            // Run in background and return early
            processSends().catch(e => console.error('Background send error:', e));

            const counts = db.prepare(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
                    SUM(CASE WHEN status IN ('pending', 'processing_queue') THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN status = 'bounced' THEN 1 ELSE 0 END) as bounced
                FROM leads WHERE campaign_id = ?
            `).get(campaignId) as any;

            return NextResponse.json({
                success: true,
                message: `Started sending up to ${pendingLeads.length} emails with a ${delaySeconds}s gap in the background. You can safely close this box.`,
                counts,
                accounts_used: validAccounts.map((a: any) => a.email),
            });
        }

        // Wait synchronously if no delay
        const { sent, errors } = await processSends();

        // Fetch updated counts
        const counts = db.prepare(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
                SUM(CASE WHEN status IN ('pending', 'processing_queue') THEN 1 ELSE 0 END) as pending,
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
