import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { suppressEmail } from '@/lib/db';

// GET — list all suppressed emails (user's own)
export async function GET(request: Request) {
    try {
        const user = await requireAuth();
        const isMaster = ['MASTER', 'ADMIN'].includes(String(user.role || '').toUpperCase());

        const list = await prisma.globalSuppression.findMany({
            where: isMaster ? {} : { userId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 500,
        });

        const suppressed = list.map((s) => ({
            id: s.id,
            email: s.email,
            domain: s.domain,
            reason: s.reason,
            user_id: s.userId,
            campaign_id: s.campaignId,
            created_at: s.createdAt,
        }));

        return NextResponse.json({ suppressed });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST — add email(s) to suppression list manually
export async function POST(request: Request) {
    try {
        const user = await requireAuth();
        const data = await request.json();

        const emails: string[] = Array.isArray(data.emails)
            ? data.emails
            : data.email
                ? [data.email]
                : [];

        if (emails.length === 0) {
            return NextResponse.json({ error: 'No email provided' }, { status: 400 });
        }

        for (const email of emails) {
            await suppressEmail(email.trim().toLowerCase(), data.reason || 'manual', user.id);
        }

        return NextResponse.json({ success: true, count: emails.length });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE — remove from suppression list (admin only)
export async function DELETE(request: Request) {
    try {
        const user = await requireAuth();
        const isMaster = ['MASTER', 'ADMIN'].includes(String(user.role || '').toUpperCase());
        if (!isMaster) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        const { email } = await request.json();
        if (email) {
            await prisma.globalSuppression.deleteMany({
                where: { email: { equals: email.trim().toLowerCase(), mode: 'insensitive' } },
            });
        }
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
