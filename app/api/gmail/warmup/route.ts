import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getEffectiveUserId } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const userId = await getEffectiveUserId();
        const { account_id, enabled } = await req.json();

        if (!account_id) {
            return NextResponse.json({ error: 'Missing account_id' }, { status: 400 });
        }

        // Security check
        if (userId) {
            const account = await prisma.gmailAccount.findFirst({
                where: { id: Number(account_id), userId },
                select: { id: true }
            });
            if (!account) {
                return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
            }
        }

        const isEnabled = Boolean(enabled);
        const existing = await prisma.gmailAccount.findUnique({
            where: { id: Number(account_id) },
            select: { warmupDay: true, warmupHealthScore: true }
        });

        if (!existing) {
            return NextResponse.json({ error: 'Account not found' }, { status: 404 });
        }

        let newDay = existing.warmupDay;
        if (isEnabled && existing.warmupDay === 0) newDay = 1;

        let newScore = existing.warmupHealthScore;
        if (isEnabled) newScore = Math.max(existing.warmupHealthScore, 30);

        await prisma.gmailAccount.update({
            where: { id: Number(account_id) },
            data: {
                warmupEnabled: isEnabled,
                warmupDay: newDay,
                warmupHealthScore: newScore,
            }
        });

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error('[warmup POST error]:', e);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const userId = await getEffectiveUserId();

        const list = await prisma.gmailAccount.findMany({
            where: userId ? { userId } : {},
            orderBy: { email: 'asc' },
        });

        const accounts = list.map((g) => ({
            id: g.id,
            email: g.email,
            name: g.name,
            status: g.status,
            warmup_enabled: g.warmupEnabled ? 1 : 0,
            warmup_day: g.warmupDay,
            warmup_sent_today: g.warmupSentToday,
            warmup_health_score: g.warmupHealthScore,
            warmup_last_date: g.warmupLastDate,
            sent_today: g.sentToday,
            daily_limit: g.dailyLimit,
            auth_method: g.authMethod,
            is_connected: g.isConnected ? 1 : 0,
        }));

        for (const account of accounts) {
            const totalSent = await prisma.emailLog.count({
                where: { gmailId: account.id, type: 'sent' }
            });
            const totalBounces = await prisma.emailLog.count({
                where: { gmailId: account.id, type: 'bounced' }
            });
            const totalReplies = await prisma.emailLog.count({
                where: { gmailId: account.id, type: 'reply' }
            });

            let score = 50;
            if (account.warmup_enabled) score += 10;

            if (totalSent > 0) {
                const bounceRate = totalBounces / totalSent;
                const replyRate = totalReplies / totalSent;
                score += Math.max(0, 30 - (bounceRate * 100 * 2));
                score += Math.min(10, replyRate * 100);
            } else if (account.warmup_enabled) {
                score += Math.min(30, account.warmup_day * 2);
            } else {
                score = 30;
            }

            const finalScore = Math.floor(Math.min(100, Math.max(0, score)));
            account.warmup_health_score = finalScore;

            await prisma.gmailAccount.update({
                where: { id: account.id },
                data: { warmupHealthScore: finalScore }
            }).catch(() => {});
        }

        return NextResponse.json(accounts);
    } catch (e: any) {
        console.error('[warmup GET error]:', e);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
