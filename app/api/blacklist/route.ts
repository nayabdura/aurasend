import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getEffectiveUserId, getUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const userId = await getEffectiveUserId();
        const where = userId ? { userId } : {};

        const list = await prisma.globalSuppression.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });

        const blacklist = list.map((s) => ({
            id: s.id,
            user_id: s.userId,
            email: s.email,
            reason: s.reason,
            created_at: s.createdAt,
        }));

        return NextResponse.json(blacklist);
    } catch (e: any) {
        console.error('[GET Blacklist Error]:', e);
        return NextResponse.json([]);
    }
}

export async function POST(req: Request) {
    try {
        const userId = await getUserId();
        const { email, reason } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email required' }, { status: 400 });
        }

        const domain = email.split('@')[1] || null;

        await prisma.globalSuppression.create({
            data: {
                userId,
                email: email.toLowerCase().trim(),
                domain,
                reason: reason || 'manual_block',
            },
        });

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error('[POST Blacklist Error]:', e);
        return NextResponse.json({ error: 'Email already blacklisted or failed to add' }, { status: 400 });
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

        const deleted = await prisma.globalSuppression.deleteMany({ where });

        if (deleted.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error('[DELETE Blacklist Error]:', e);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
