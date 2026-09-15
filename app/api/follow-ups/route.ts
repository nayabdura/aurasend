import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/follow-ups?campaign_id=X
export async function GET(req: Request) {
    try {
        const user = await requireAuth();
        const { searchParams } = new URL(req.url);
        const campaignId = searchParams.get('campaign_id');

        const isMaster = ['MASTER', 'ADMIN'].includes(String(user.role || '').toUpperCase());
        const where: any = {};
        if (campaignId) {
            where.campaignId = Number(campaignId);
        } else if (!isMaster) {
            where.campaign = { userId: user.id };
        }

        const sequences = await prisma.sequence.findMany({
            where,
            orderBy: [{ campaignId: 'asc' }, { stepNumber: 'asc' }],
        }).catch(() => []);

        const followUps = sequences.map((s) => ({
            id: s.id,
            campaign_id: s.campaignId,
            step_number: s.stepNumber,
            delay_days: s.delayDays,
            subject: s.subjectSpintax,
            body: s.bodySpintax,
            is_ab_test: s.isAbTest ? 1 : 0,
            created_at: s.createdAt,
        }));

        return NextResponse.json(followUps);
    } catch (e: any) {
        console.error('[GET Followups Error]:', e);
        return NextResponse.json([]);
    }
}

// POST /api/follow-ups - create follow-up
export async function POST(req: Request) {
    try {
        const user = await requireAuth();
        const body = await req.json();
        const { campaign_id, step_number, delay_days, subject, body: bodyText } = body;

        if (!campaign_id) return NextResponse.json({ error: 'campaign_id required' }, { status: 400 });

        const isMaster = ['MASTER', 'ADMIN'].includes(String(user.role || '').toUpperCase());
        const camp = await prisma.campaign.findFirst({
            where: isMaster ? { id: Number(campaign_id) } : { id: Number(campaign_id), userId: user.id },
            select: { id: true },
        });

        if (!camp) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

        const created = await prisma.sequence.create({
            data: {
                campaignId: Number(campaign_id),
                stepNumber: step_number || 1,
                delayDays: delay_days || 3,
                subjectSpintax: subject || '',
                bodySpintax: bodyText || '',
            },
        });

        return NextResponse.json({ id: created.id, success: true });
    } catch (e: any) {
        console.error('[POST Followup Error]:', e);
        return NextResponse.json({ error: 'Failed to create follow-up.' }, { status: 500 });
    }
}
