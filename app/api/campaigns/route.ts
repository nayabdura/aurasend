import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getEffectiveUserId, getUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const userId = await getEffectiveUserId();
        const where = userId ? { userId } : {};

        const list = await prisma.campaign.findMany({
            where,
            include: {
                leads: {
                    select: {
                        id: true,
                        status: true,
                        opened: true,
                        replied: true,
                    },
                },
            },
            orderBy: { id: 'desc' },
        });

        const campaigns = list.map((c) => {
            const leadCount = c.leads.length;
            const sentCount = c.leads.filter(
                (l) => !['pending', 'processing_queue', 'invalid'].includes(l.status)
            ).length;
            const openedCount = c.leads.filter((l) => l.opened).length;
            const repliedCount = c.leads.filter((l) => l.replied).length;

            return {
                id: c.id,
                user_id: c.userId,
                workspace_id: c.workspaceId || 1,
                name: c.name,
                template_id: c.templateId,
                template_id_b: c.templateIdB,
                status: c.status,
                send_window_start: c.sendWindowStart,
                send_window_end: c.sendWindowEnd,
                timezone: c.timezone,
                delay_between_emails: c.delayBetweenEmails,
                followup1_delay_hours: c.followup1DelayHours,
                followup2_delay_hours: c.followup2DelayHours,
                followup1_template_id: c.followup1TemplateId,
                followup2_template_id: c.followup2TemplateId,
                followup_enabled: c.followupEnabled ? 1 : 0,
                created_at: c.createdAt,
                updated_at: c.updatedAt,
                lead_count: leadCount,
                sent_count: sentCount,
                opened_count: openedCount,
                replied_count: repliedCount,
            };
        });

        return NextResponse.json(campaigns);
    } catch (e: any) {
        console.error('[GET Campaigns Error]:', e);
        return NextResponse.json({ error: 'Failed to fetch campaigns.' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        let userId: number;
        try {
            userId = await getUserId();
        } catch (authErr: any) {
            if (authErr?.digest?.startsWith('NEXT_REDIRECT')) throw authErr;
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const {
            name,
            template_id,
            template_id_b,
            send_start,
            send_end,
            followup1_delay_hours,
            followup2_delay_hours,
            followup1_template_id,
            followup2_template_id,
            followup_enabled,
        } = body;

        if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

        const created = await prisma.campaign.create({
            data: {
                userId,
                workspaceId: 1,
                name,
                templateId: template_id ? Number(template_id) : null,
                templateIdB: template_id_b ? Number(template_id_b) : null,
                status: 'paused',
                sendWindowStart: send_start || '09:00',
                sendWindowEnd: send_end || '18:00',
                followup1DelayHours: followup1_delay_hours ? Number(followup1_delay_hours) : 48,
                followup2DelayHours: followup2_delay_hours ? Number(followup2_delay_hours) : 96,
                followup1TemplateId: followup1_template_id ? Number(followup1_template_id) : null,
                followup2TemplateId: followup2_template_id ? Number(followup2_template_id) : null,
                followupEnabled: followup_enabled !== false,
            },
        });

        return NextResponse.json({ success: true, id: created.id });
    } catch (e: any) {
        if (e?.digest?.startsWith('NEXT_REDIRECT') || e?.digest?.startsWith('NEXT_NOT_FOUND')) throw e;
        console.error('[POST Campaign Error]:', e);
        return NextResponse.json({ error: 'Failed to create campaign.' }, { status: 500 });
    }
}
