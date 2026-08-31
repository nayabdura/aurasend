import 'server-only';
import prisma from '../database/prisma';

export interface DashboardData {
  gmailAccounts: { count: number };
  campaigns: { count: number };
  sentToday: { count: number };
  totalSent: { count: number };
  repliedLeads: { count: number };
  totalLeads: { count: number };
  recentActivity: Array<{
    id: number;
    lead_email: string | null;
    gmail_email: string | null;
    type: string;
    timestamp: number;
  }>;
  accountHealth: Array<{
    email: string;
    status: string;
    sent_today: number;
    daily_limit: number;
    is_connected: number;
    warmup_enabled: number;
  }>;
  trendData: Array<{ date: string; sent: number }>;
}

export class DashboardService {
  static async getDashboardStats(userId: number, role: string): Promise<DashboardData> {
    const isMaster = String(role || '').toUpperCase() === 'MASTER';

    try {
      const startOfTodayMs = BigInt(new Date().setHours(0, 0, 0, 0));
      const sevenDaysAgoMs = BigInt(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const [
        gmailCount,
        campaignCount,
        sentTodayCount,
        totalSentCount,
        repliedLeadsCount,
        totalLeadsCount,
        recentLogs,
        accounts,
        sevenDayLogs,
      ] = await Promise.all([
        prisma.gmailAccount.count({
          where: isMaster ? { isConnected: true } : { userId, isConnected: true },
        }).catch(() => 0),

        prisma.campaign.count({
          where: isMaster ? {} : { userId },
        }).catch(() => 0),

        prisma.emailLog.count({
          where: isMaster
            ? { timestamp: { gte: startOfTodayMs } }
            : { userId, timestamp: { gte: startOfTodayMs } },
        }).catch(() => 0),

        prisma.emailLog.count({
          where: isMaster ? {} : { userId },
        }).catch(() => 0),

        prisma.lead.count({
          where: isMaster ? { replied: true } : { userId, replied: true },
        }).catch(() => 0),

        prisma.lead.count({
          where: isMaster ? {} : { userId },
        }).catch(() => 0),

        prisma.emailLog.findMany({
          where: isMaster ? {} : { userId },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            lead: { select: { email: true } },
            gmailAccount: { select: { email: true } },
          },
        }).catch(() => []),

        prisma.gmailAccount.findMany({
          where: isMaster ? {} : { userId },
          select: {
            email: true,
            status: true,
            sentToday: true,
            dailyLimit: true,
            isConnected: true,
            warmupEnabled: true,
          },
        }).catch(() => []),

        prisma.emailLog.findMany({
          where: isMaster
            ? { timestamp: { gte: sevenDaysAgoMs } }
            : { userId, timestamp: { gte: sevenDaysAgoMs } },
          select: { createdAt: true, timestamp: true },
        }).catch(() => []),
      ]);

      const recentActivity = recentLogs.map((log) => ({
        id: log.id,
        lead_email: log.lead?.email || null,
        gmail_email: log.gmailAccount?.email || null,
        type: log.type || 'sent',
        timestamp: Number(log.timestamp || Date.now() / 1000),
      }));

      const accountHealth = accounts.map((acc) => ({
        email: acc.email,
        status: acc.status,
        sent_today: acc.sentToday,
        daily_limit: acc.dailyLimit,
        is_connected: acc.isConnected ? 1 : 0,
        warmup_enabled: acc.warmupEnabled ? 1 : 0,
      }));

      const dateCounts = new Map<string, number>();
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const isoDate = d.toISOString().split('T')[0];
        dateCounts.set(isoDate, 0);
      }

      for (const l of sevenDayLogs) {
        const dateStr = l.createdAt
          ? l.createdAt.toISOString().split('T')[0]
          : new Date(Number(l.timestamp)).toISOString().split('T')[0];
        if (dateCounts.has(dateStr)) {
          dateCounts.set(dateStr, (dateCounts.get(dateStr) || 0) + 1);
        }
      }

      const trendData = Array.from(dateCounts.entries()).map(([date, sent]) => ({ date, sent }));

      return {
        gmailAccounts: { count: gmailCount },
        campaigns: { count: campaignCount },
        sentToday: { count: sentTodayCount },
        totalSent: { count: totalSentCount },
        repliedLeads: { count: repliedLeadsCount },
        totalLeads: { count: totalLeadsCount },
        recentActivity,
        accountHealth,
        trendData,
      };
    } catch (e: any) {
      console.error('[DashboardService.getDashboardStats] Database query exception:', e);
      return {
        gmailAccounts: { count: 0 },
        campaigns: { count: 0 },
        sentToday: { count: 0 },
        totalSent: { count: 0 },
        repliedLeads: { count: 0 },
        totalLeads: { count: 0 },
        recentActivity: [],
        accountHealth: [],
        trendData: [],
      };
    }
  }
}

export default DashboardService;
