import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/conversations - list reply threads
export async function GET(req: Request) {
    try {
        const user = await requireAuth();
        const { searchParams } = new URL(req.url);
        const unreadOnly = searchParams.get('unread') === 'true';

        const isMaster = user.role === 'master';
        const where: any = { replied: true };
        if (!isMaster) where.userId = user.id;

        const [leads, unreadCount] = await Promise.all([
            prisma.lead.findMany({
                where,
                include: { campaign: { select: { name: true } } },
                orderBy: { id: 'desc' },
                take: 50,
            }).catch(() => []),
            prisma.lead.count({
                where: { ...where, opened: false },
            }).catch(() => 0),
        ]);

        const threads = leads.map((l: any) => ({
            id: l.id,
            user_id: l.userId,
            gmail_account_id: null,
            thread_id: l.threadId || String(l.id),
            lead_email: l.email,
            subject: `Re: Outreach to ${l.company || l.name || l.email}`,
            snippet: l.intro || 'Reply received from lead',
            last_message_date: l.repliedAt ? Number(l.repliedAt) : Date.now(),
            is_read: 1,
            ai_sentiment: 'interested',
            ai_suggested_reply: null,
            from_account: l.email,
        }));

        return NextResponse.json({ threads, unreadCount });
    } catch (e: any) {
        console.error('[GET Conversations Error]:', e);
        return NextResponse.json({ threads: [], unreadCount: 0 });
    }
}
