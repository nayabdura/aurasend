import DashboardLayout from '@/components/DashboardLayout';
import { requireMaster } from '@/lib/auth';
import db from '@/lib/db';
import AdminClient from './AdminClient';

export const dynamic = 'force-dynamic';

function safeQuery<T>(fn: () => T, fallback: T): T {
    try { return fn(); } catch { return fallback; }
}
function safeGet<T>(fn: () => T, fallback: T): T {
    try { return fn(); } catch { return fallback; }
}

export default async function AdminPage() {
    await requireMaster();

    const allUsers = safeQuery(() =>
        db.prepare('SELECT id, email, name, role, plan, plan_status, created_at, last_login FROM users ORDER BY id DESC').all() as any[]
        , []);

    const allGmailAccounts = safeQuery(() =>
        db.prepare('SELECT g.id, g.email, g.status, g.sent_today, g.daily_limit, g.auth_method, g.warmup_enabled, u.email as owner_email FROM gmail_accounts g LEFT JOIN users u ON g.user_id = u.id ORDER BY g.id DESC').all() as any[]
        , []);

    const allCampaigns = safeQuery(() =>
        db.prepare('SELECT c.id, c.name, c.status, c.created_at, u.email as owner_email FROM campaigns c LEFT JOIN users u ON c.user_id = u.id ORDER BY c.id DESC').all() as any[]
        , []);

    const initialBlogs = safeQuery(() =>
        db.prepare('SELECT id, title, slug, is_published, created_at FROM blog_posts ORDER BY id DESC').all() as any[]
        , []);

    const recentLogs = safeQuery(() =>
        db.prepare('SELECT * FROM system_logs ORDER BY id DESC LIMIT 50').all() as any[]
        , []);

    // ── Overview Metrics ──────────────────────────────────────────────────────
    const totalLeads = safeGet(() => (db.prepare('SELECT COUNT(*) as c FROM leads').get() as any).c, 0);
    const totalSentToday = safeGet(() => (db.prepare("SELECT SUM(sent_today) as c FROM gmail_accounts").get() as any)?.c ?? 0, 0);
    const totalSentAllTime = safeGet(() => (db.prepare("SELECT COUNT(*) as c FROM email_logs WHERE type = 'sent'").get() as any).c, 0);
    const totalOpened = safeGet(() => (db.prepare('SELECT COUNT(*) as c FROM leads WHERE opened = 1').get() as any).c, 0);
    const totalReplied = safeGet(() => (db.prepare('SELECT COUNT(*) as c FROM leads WHERE replied = 1').get() as any).c, 0);
    const totalBounced = safeGet(() => (db.prepare("SELECT COUNT(*) as c FROM leads WHERE status = 'bounced'").get() as any).c, 0);
    const activeCampaigns = safeGet(() => (db.prepare("SELECT COUNT(*) as c FROM campaigns WHERE status = 'running'").get() as any).c, 0);
    const warmupAccounts = safeGet(() => (db.prepare("SELECT COUNT(*) as c FROM gmail_accounts WHERE warmup_enabled = 1").get() as any).c, 0);
    const activeAccounts = safeGet(() => (db.prepare("SELECT COUNT(*) as c FROM gmail_accounts WHERE status = 'active' AND is_connected = 1").get() as any).c, 0);

    const openRate = totalSentAllTime > 0 ? ((totalOpened / totalSentAllTime) * 100).toFixed(1) : '0.0';
    const replyRate = totalSentAllTime > 0 ? ((totalReplied / totalSentAllTime) * 100).toFixed(1) : '0.0';
    const bounceRate = totalSentAllTime > 0 ? ((totalBounced / totalSentAllTime) * 100).toFixed(1) : '0.0';

    const metrics = {
        totalLeads, totalSentToday, totalSentAllTime,
        openRate, replyRate, bounceRate,
        activeCampaigns, warmupAccounts, activeAccounts,
        totalUsers: allUsers.length,
        totalInboxes: allGmailAccounts.length,
    };

    return (
        <DashboardLayout>
            <AdminClient
                initialUsers={allUsers}
                initialGmailAccounts={allGmailAccounts}
                initialCampaigns={allCampaigns}
                totalLeads={totalLeads}
                recentLogs={recentLogs}
                initialBlogs={initialBlogs}
                metrics={metrics}
            />
        </DashboardLayout>
    );
}
