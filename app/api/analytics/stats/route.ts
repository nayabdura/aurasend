import { NextResponse } from 'next/server';
import { getEffectiveUserId } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const userId = await getEffectiveUserId();
        const where = userId ? { userId } : {};

        const [
            totalSent,
            totalOpened,
            totalReplied,
            totalBounced,
            pending,
            invalid,
            sent,
            recentLogs,
        ] = await Promise.all([
            prisma.lead.count({
                where: { ...where, OR: [{ sentAt: { not: null } }, { status: { not: 'pending' } }] },
            }).catch(() => 0),

            prisma.lead.count({
                where: { ...where, opened: true },
            }).catch(() => 0),

            prisma.lead.count({
                where: { ...where, replied: true },
            }).catch(() => 0),

            prisma.lead.count({
                where: { ...where, status: 'bounced' },
            }).catch(() => 0),

            prisma.lead.count({
                where: { ...where, status: 'pending' },
            }).catch(() => 0),

            prisma.lead.count({
                where: { ...where, status: 'invalid' },
            }).catch(() => 0),

            prisma.lead.count({
                where: { ...where, status: 'sent' },
            }).catch(() => 0),

            prisma.emailLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: 100,
                select: { createdAt: true, timestamp: true },
            }).catch(() => []),
        ]);

        // Aggregate daily send logs
        const dailyCounts = new Map<string, number>();
        for (const log of recentLogs) {
            const dateStr = log.createdAt
                ? log.createdAt.toISOString().split('T')[0]
                : new Date(Number(log.timestamp)).toISOString().split('T')[0];
            dailyCounts.set(dateStr, (dailyCounts.get(dateStr) || 0) + 1);
        }

        const daily = Array.from(dailyCounts.entries())
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => (a.date > b.date ? 1 : -1))
            .slice(-7);

        return NextResponse.json({
            total_sent: totalSent,
            total_opened: totalOpened,
            total_replied: totalReplied,
            total_bounced: totalBounced,
            pending,
            sent,
            invalid,
            bounced: totalBounced,
            daily_sends: daily,
        });
    } catch (error: any) {
        console.error('[AnalyticsStatsRoute] Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
