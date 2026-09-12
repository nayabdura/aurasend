import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getEffectiveUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const userId = await getEffectiveUserId();
        const where: any = {
            status: { not: 'deleted' },
        };
        if (userId) where.userId = userId;

        const list = await prisma.gmailAccount.findMany({
            where,
            select: {
                id: true,
                email: true,
                status: true,
                dailyLimit: true,
                sentToday: true,
                userId: true,
            },
            orderBy: { id: 'desc' },
        });

        const accounts = list.map((a) => ({
            id: a.id,
            email: a.email,
            status: a.status,
            daily_limit: a.dailyLimit,
            sent_today: a.sentToday,
            user_id: a.userId,
        }));

        return NextResponse.json(accounts);
    } catch (e: any) {
        console.error('[GET Gmail Accounts Error]:', e);
        return NextResponse.json([]);
    }
}
