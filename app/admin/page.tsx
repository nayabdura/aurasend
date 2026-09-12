import DashboardLayout from '@/components/DashboardLayout';
import { requireMaster } from '@/lib/auth';
import prisma from '@/lib/prisma';
import AdminClient from './AdminClient';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
    await requireMaster();

    let allUsers: any[] = [];
    let allGmailAccounts: any[] = [];
    let allCampaigns: any[] = [];
    let initialBlogs: any[] = [];
    let recentLogs: any[] = [];

    let totalLeads = 0;
    let totalSentToday = 0;
    let totalSentAllTime = 0;
    let totalOpened = 0;
    let totalReplied = 0;
    let totalBounced = 0;
    let activeCampaigns = 0;
    let warmupAccounts = 0;
    let activeAccounts = 0;

    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                plan: true,
                planStatus: true,
                createdAt: true,
                lastLogin: true,
            },
            orderBy: { id: 'desc' },
        });
        allUsers = users.map((u) => ({
            id: u.id,
            email: u.email,
            name: u.name,
            role: u.role,
            plan: u.plan,
            plan_status: u.planStatus,
            created_at: u.createdAt,
            last_login: u.lastLogin,
        }));

        const gmailAccounts = await prisma.gmailAccount.findMany({
            include: { user: true },
            orderBy: { id: 'desc' },
        });
        allGmailAccounts = gmailAccounts.map((g) => ({
            id: g.id,
            email: g.email,
            status: g.status,
            sent_today: g.sentToday,
            daily_limit: g.dailyLimit,
            auth_method: g.authMethod,
            warmup_enabled: g.warmupEnabled ? 1 : 0,
            owner_email: g.user?.email || null,
        }));

        const campaigns = await prisma.campaign.findMany({
            include: { user: true },
            orderBy: { id: 'desc' },
        });
        allCampaigns = campaigns.map((c) => ({
            id: c.id,
            name: c.name,
            status: c.status,
            created_at: c.createdAt,
            owner_email: c.user?.email || null,
        }));

        const blogs = await prisma.blogPost.findMany({
            orderBy: { id: 'desc' },
            select: { id: true, title: true, slug: true, isPublished: true, createdAt: true },
        }).catch(() => []);
        initialBlogs = blogs.map((b) => ({
            id: b.id,
            title: b.title,
            slug: b.slug,
            is_published: b.isPublished ? 1 : 0,
            created_at: b.createdAt,
        }));

        const logs = await prisma.emailLog.findMany({
            orderBy: { id: 'desc' },
            take: 50,
        }).catch(() => []);
        recentLogs = logs.map((l) => ({
            id: l.id,
            type: l.type,
            recipient: l.messageId || 'N/A',
            status: l.type,
            created_at: l.createdAt,
        }));

        totalLeads = await prisma.lead.count().catch(() => 0);
        totalSentToday = gmailAccounts.reduce((acc, g) => acc + (g.sentToday || 0), 0);
        totalSentAllTime = await prisma.emailLog.count({ where: { type: 'sent' } }).catch(() => 0);
        totalOpened = await prisma.lead.count({ where: { opened: true } }).catch(() => 0);
        totalReplied = await prisma.lead.count({ where: { replied: true } }).catch(() => 0);
        totalBounced = await prisma.lead.count({ where: { status: 'bounced' } }).catch(() => 0);
        activeCampaigns = campaigns.filter((c) => c.status === 'running').length;
        warmupAccounts = gmailAccounts.filter((g) => g.warmupEnabled).length;
        activeAccounts = gmailAccounts.filter((g) => g.status === 'active' && g.isConnected).length;
    } catch (e) {
        console.error('[AdminPage] Error loading admin dashboard data:', e);
    }

    const openRate = totalSentAllTime > 0 ? ((totalOpened / totalSentAllTime) * 100).toFixed(1) : '0.0';
    const replyRate = totalSentAllTime > 0 ? ((totalReplied / totalSentAllTime) * 100).toFixed(1) : '0.0';
    const bounceRate = totalSentAllTime > 0 ? ((totalBounced / totalSentAllTime) * 100).toFixed(1) : '0.0';

    const metrics = {
        totalLeads,
        totalSentToday,
        totalSentAllTime,
        openRate,
        replyRate,
        bounceRate,
        activeCampaigns,
        warmupAccounts,
        activeAccounts,
        totalUsers: Array.isArray(allUsers) ? allUsers.length : 0,
        totalInboxes: Array.isArray(allGmailAccounts) ? allGmailAccounts.length : 0,
    };

    return (
        <DashboardLayout>
            <AdminClient
                initialUsers={Array.isArray(allUsers) ? allUsers : []}
                initialGmailAccounts={Array.isArray(allGmailAccounts) ? allGmailAccounts : []}
                initialCampaigns={Array.isArray(allCampaigns) ? allCampaigns : []}
                totalLeads={totalLeads}
                recentLogs={Array.isArray(recentLogs) ? recentLogs : []}
                initialBlogs={Array.isArray(initialBlogs) ? initialBlogs : []}
                metrics={metrics}
            />
        </DashboardLayout>
    );
}
