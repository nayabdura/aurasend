import { NextResponse } from 'next/server';
import { requireAuth, getEffectiveUserId, getUserId } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/contacts - list all contacts
export async function GET(req: Request) {
    try {
        const userId = await getEffectiveUserId();
        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status') || '';
        const limit = parseInt(searchParams.get('limit') || '100');
        const offset = parseInt(searchParams.get('offset') || '0');

        const where: any = {};
        if (userId) where.userId = userId;
        if (status) where.replyStatus = status;

        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { company: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [list, total] = await Promise.all([
            prisma.contact.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            prisma.contact.count({ where }),
        ]);

        const contacts = list.map((c) => ({
            id: c.id,
            user_id: c.userId,
            email: c.email,
            first_name: c.firstName,
            last_name: c.lastName,
            company: c.company,
            current_role: c.currentRole,
            campaign_id: c.campaignId,
            campaign_status: c.campaignStatus,
            last_contact_date: c.lastContactDate,
            reply_status: c.replyStatus,
            bounce_status: c.bounceStatus ? 1 : 0,
            email_valid: c.emailValid ? 1 : 0,
            created_at: c.createdAt,
        }));

        return NextResponse.json({ contacts, total });
    } catch (e: any) {
        console.error('[GET Contacts Error]:', e);
        return NextResponse.json({ contacts: [], total: 0 });
    }
}

// POST /api/contacts - create contact
export async function POST(req: Request) {
    try {
        await requireAuth();
        const userId = await getUserId();
        const body = await req.json();
        const { email, first_name, last_name, company, current_role, campaign_id } = body;

        if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

        const created = await prisma.contact.upsert({
            where: {
                userId_email: {
                    userId,
                    email: email.toLowerCase().trim(),
                },
            },
            create: {
                userId,
                email: email.toLowerCase().trim(),
                firstName: first_name || null,
                lastName: last_name || null,
                company: company || null,
                currentRole: current_role || null,
                campaignId: campaign_id ? Number(campaign_id) : null,
            },
            update: {
                firstName: first_name || undefined,
                lastName: last_name || undefined,
                company: company || undefined,
                currentRole: current_role || undefined,
                campaignId: campaign_id ? Number(campaign_id) : undefined,
            },
        });

        return NextResponse.json({ id: created.id, success: true });
    } catch (e: any) {
        console.error('[POST Contact Error]:', e);
        return NextResponse.json({ error: 'Failed to create contact.' }, { status: 500 });
    }
}
