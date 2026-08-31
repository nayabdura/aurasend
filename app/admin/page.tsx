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

    if (process.env.DATABASE_URL) {
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

            totalLeads = await prisma.lead.count();
            totalSentToday = gmailAccounts.reduce((acc, g) => acc + g.sentToday, 0);
            totalSentAllTime = await prisma.emailLog.count({ where: { type: 'sent' } });
            totalOpened = await prisma.lead.count({ where: { status: 'opened' } });
            totalReplied = await prisma.lead.count({ where: { status: 'replied' } });
            totalBounced = await prisma.lead.count({ where: { status: 'bounced' } });
            activeCampaigns = campaigns.filter((c) => c.status === 'running').length;
            warmupAccounts = gmailAccounts.filter((g) => g.warmupEnabled).length;
            activeAccounts = gmailAccounts.filter((g) => g.status === 'active' && g.isConnected).length;
        } catch (e) {
            console.error('Error loading Admin dashboard data from Postgres:', e);
        }
    } else {
        const db = require('@/lib/db').default;
        try {
            allUsers = db.prepare('SELECT id, email, name, role, plan, plan_status, created_at, last_login FROM users ORDER BY id DESC').all() as any[];
            allGmailAccounts = db.prepare('SELECT g.id, g.email, g.status, g.sent_today, g.daily_limit, g.auth_method, g.warmup_enabled, u.email as owner_email FROM gmail_accounts g LEFT JOIN users u ON g.user_id = u.id ORDER BY g.id DESC').all() as any[];
            allCampaigns = db.prepare('SELECT c.id, c.name, c.status, c.created_at, u.email as owner_email FROM campaigns c LEFT JOIN users u ON c.user_id = u.id ORDER BY c.id DESC').all() as any[];
            initialBlogs = db.prepare('SELECT id, title, slug, is_published, created_at FROM blog_posts ORDER BY id DESC').all() as any[];
            recentLogs = db.prepare('SELECT * FROM system_logs ORDER BY id DESC LIMIT 50').all() as any[];

            totalLeads = (db.prepare('SELECT COUNT(*) as c FROM leads').get() as any)?.c || 0;
            totalSentToday = (db.prepare("SELECT SUM(sent_today) as c FROM gmail_accounts").get() as any)?.c || 0;
            totalSentAllTime = (db.prepare("SELECT COUNT(*) as c FROM email_logs WHERE type = 'sent'").get() as any)?.c || 0;
            totalOpened = (db.prepare('SELECT COUNT(*) as c FROM leads WHERE opened = 1').get() as any)?.c || 0;
            totalReplied = (db.prepare('SELECT COUNT(*) as c FROM leads WHERE replied = 1').get() as any)?.c || 0;
            totalBounced = (db.prepare("SELECT COUNT(*) as c FROM leads WHERE status = 'bounced'").get() as any)?.c || 0;
            activeCampaigns = (db.prepare("SELECT COUNT(*) as c FROM campaigns WHERE status = 'running'").get() as any)?.c || 0;
            warmupAccounts = (db.prepare("SELECT COUNT(*) as c FROM gmail_accounts WHERE warmup_enabled = 1").get() as any)?.c || 0;
            activeAccounts = (db.prepare("SELECT COUNT(*) as c FROM gmail_accounts WHERE status = 'active' AND is_connected = 1").get() as any)?.c || 0;
        } catch (e) {
            console.error('Error loading Admin dashboard data from SQLite:', e);
        }
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
