import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getEffectiveUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const userId = await getEffectiveUserId();
        const where = userId ? { userId } : {};

        const list = await prisma.lead.findMany({
            where,
            orderBy: { id: 'desc' },
            take: 1000,
            select: {
                id: true,
                name: true,
                email: true,
                company: true,
                website: true,
                status: true,
                opened: true,
                replied: true,
                sentAt: true,
                openedAt: true,
                repliedAt: true,
                campaignId: true,
                leadType: true,
                userId: true,
            },
        });

        const leads = list.map((l) => ({
            id: l.id,
            name: l.name,
            email: l.email,
            company: l.company,
            website: l.website,
            status: l.status,
            opened: l.opened ? 1 : 0,
            replied: l.replied ? 1 : 0,
            sent_at: l.sentAt ? Number(l.sentAt) : null,
            opened_at: l.openedAt ? Number(l.openedAt) : null,
            replied_at: l.repliedAt ? Number(l.repliedAt) : null,
            campaign_id: l.campaignId,
            lead_type: l.leadType,
            user_id: l.userId,
        }));

        return NextResponse.json(leads);
    } catch (e: any) {
        console.error('[GET Leads Error]:', e);
        return NextResponse.json([]);
    }
}

export async function DELETE(req: Request) {
    try {
        const userId = await getEffectiveUserId();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
        }

        const targetId = Number(id);
        const where: any = { id: targetId };
        if (userId) where.userId = userId;

        const deleted = await prisma.lead.deleteMany({ where });

        if (deleted.count === 0) {
            return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error('[DELETE Lead Error]:', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
