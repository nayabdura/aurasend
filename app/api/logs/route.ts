import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getEffectiveUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const userId = await getEffectiveUserId();
        const where = userId ? { userId } : {};

        const list = await prisma.emailLog.findMany({
            where,
            include: {
                lead: {
                    select: {
                        email: true,
                        name: true,
                        campaign: { select: { name: true } },
                    },
                },
                gmailAccount: {
                    select: { email: true },
                },
            },
            orderBy: { timestamp: 'desc' },
            take: 200,
        });

        const logs = list.map((e: any) => ({
            id: e.id,
            user_id: e.userId,
            workspace_id: e.workspaceId || 1,
            lead_id: e.leadId,
            gmail_id: e.gmailId,
            type: e.type,
            timestamp: Number(e.timestamp),
            message_id: e.messageId,
            to_email: e.lead?.email || 'N/A',
            subject: e.lead?.name ? `Outreach to ${e.lead.name}` : 'Cold Outreach',
            created_at: e.createdAt,
            lead_email: e.lead?.email || null,
            lead_name: e.lead?.name || null,
            gmail_address: e.gmailAccount?.email || null,
            campaign_name: e.lead?.campaign?.name || null,
        }));

        return NextResponse.json(logs);
    } catch (e: any) {
        console.error('[GET Logs Error]:', e);
        return NextResponse.json([]);
    }
}
