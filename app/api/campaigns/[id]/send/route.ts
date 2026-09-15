import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { enqueueSend } from '@/lib/queue';

// POST /api/campaigns/[id]/send — manually trigger sending for a specific campaign
export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const user = await requireAuth();
        const campaignId = parseInt(params.id);

        if (isNaN(campaignId)) {
            return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 });
        }

        const userRole = String(user.role || '').toUpperCase();
        const isMaster = userRole === 'MASTER' || userRole === 'ADMIN';

        // Validate campaign ownership
        const campaign = await prisma.campaign.findFirst({
            where: isMaster ? { id: campaignId } : { id: campaignId, userId: user.id },
        });

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
        const rawAccounts: any[] = await prisma.$queryRaw`
            SELECT ga.* FROM gmail_accounts ga 
            JOIN campaign_accounts ca ON ga.id = ca.gmail_account_id 
            WHERE ca.campaign_id = ${campaignId} AND ga.is_connected = true
              AND ga.status IN ('active', 'paused')
        `;

        if (!rawAccounts || rawAccounts.length === 0) {
            return NextResponse.json({ error: 'No active Gmail accounts assigned to this campaign. Please edit the campaign and select accounts.' }, { status: 400 });
        }

        // Map accounts
        const accounts = rawAccounts.map((a: any) => ({
            id: Number(a.id),
            email: String(a.email),
            sent_today: Number(a.sent_today || 0),
            daily_limit: Number(a.daily_limit || 20),
        }));

        // Get template or fallback for Gemini AI
        let template: any = null;
        if (campaign.templateId) {
            template = await prisma.template.findUnique({ where: { id: campaign.templateId } });
        }
        if (!template) {
            const fallbackTpl = await prisma.template.findFirst({ orderBy: { id: 'asc' } });
            template = fallbackTpl || {
                id: 0,
                name: 'Gemini AI Auto-Generated',
                subject: 'Quick question for {{first_name}}',
                body: 'Hi {{first_name}},\n\nI came across your profile at {{company}}...'
            };
        }

        // Filter accounts that still have quota
        const validAccounts = accounts.filter((a) => a.sent_today < a.daily_limit);
        if (validAccounts.length === 0) {
            return NextResponse.json({ error: 'All assigned accounts have reached their daily send limit.' }, { status: 400 });
        }

        // Allow isValid = true OR isValid IS NULL (not yet verified).
        // Only hard-block isValid = false (confirmed invalid)
        const pendingLeads = await prisma.lead.findMany({
            where: {
                campaignId,
                status: 'pending',
                OR: [
                    { isValid: true },
                    { isValid: null as any },
                ],
            },
            orderBy: { id: 'asc' },
            take: 100,
        });

        if (pendingLeads.length === 0) {
            // Check if there are any leads at all
            const totalLeads = await prisma.lead.count({ where: { campaignId } });
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
        let templateB: any = null;
        if (campaign.templateIdB) {
            templateB = await prisma.template.findUnique({ where: { id: campaign.templateIdB } });
        }

        // Distribute leads across valid accounts (round-robin)
        const processSends = async () => {
            let sent = 0;
            let errors = 0;

            const leadsToProcess: { lead: any; account: any }[] = [];

            let accountIdx = 0;
            for (let i = 0; i < pendingLeads.length; i++) {
                const lead = pendingLeads[i];

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
                const updated = await prisma.lead.updateMany({
                    where: { id: lead.id, status: 'pending' },
                    data: { status: 'processing_queue' },
                });

                if (updated.count > 0) {
                    leadsToProcess.push({ lead, account });
                    account.sent_today++; // Reserve quota
                    accountIdx++;
                }
            }

            for (let i = 0; i < leadsToProcess.length; i++) {
                const { lead, account } = leadsToProcess[i];

                if (i > 0 && delaySeconds > 0) {
                    await new Promise(r => setTimeout(r, delaySeconds * 1000));
                }

                const chosenTemplateId = (templateB && Math.random() > 0.5)
                    ? templateB.id
                    : (campaign.templateId || undefined);

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
                    await prisma.lead.update({
                        where: { id: lead.id },
                        data: { status: 'pending' },
                    }).catch(() => {});
                    account.sent_today = Math.max(0, account.sent_today - 1);
                }
            }

            return { sent, errors };
        };

        const getCounts = async () => {
            const total = await prisma.lead.count({ where: { campaignId } });
            const sent = await prisma.lead.count({ where: { campaignId, status: 'sent' } });
            const pending = await prisma.lead.count({ where: { campaignId, status: { in: ['pending', 'processing_queue'] } } });
            const bounced = await prisma.lead.count({ where: { campaignId, status: 'bounced' } });
            return { total, sent, pending, bounced };
        };

        if (delaySeconds > 0) {
            // Run in background and return early
            processSends().catch(e => console.error('Background send error:', e));

            const counts = await getCounts();

            return NextResponse.json({
                success: true,
                message: `Started sending up to ${pendingLeads.length} emails with a ${delaySeconds}s gap in the background. You can safely close this box.`,
                counts,
                accounts_used: validAccounts.map((a: any) => a.email),
            });
        }

        // Wait synchronously if no delay
        const { sent, errors } = await processSends();

        const counts = await getCounts();

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
