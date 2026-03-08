import DashboardLayout from '@/components/DashboardLayout';
import { requireAuth } from '@/lib/auth';
import db from '@/lib/db';
import { Mail, Megaphone, Send, TrendingUp, Magnet, Activity } from 'lucide-react';
import DashboardClient from './DashboardClient';
import DashboardChartClient from '@/app/dashboard/DashboardChartClient';

export default async function DashboardPage() {
    const user = await requireAuth();

    // Fetch stats based on role
    // Master sees global verification stats, Users see their own
    let gmailAccounts, campaigns, sentToday, totalSent, repliedLeads, totalLeads, recentActivity, accountHealth, trendData;

    if (user.role === 'master') {
        gmailAccounts = db.prepare(
            'SELECT COUNT(*) as count FROM gmail_accounts WHERE is_connected = 1'
        ).get() as any;

        campaigns = db.prepare(
            'SELECT COUNT(*) as count FROM campaigns'
        ).get() as any;

        sentToday = db.prepare(`
            SELECT COUNT(*) as count FROM email_logs 
            WHERE DATE(timestamp, 'unixepoch') = DATE('now')
        `).get() as any;

        totalSent = db.prepare(
            'SELECT COUNT(*) as count FROM email_logs'
        ).get() as any;

        repliedLeads = db.prepare(
            'SELECT COUNT(*) as count FROM leads WHERE replied = 1'
        ).get() as any;

        totalLeads = db.prepare(
            'SELECT COUNT(*) as count FROM leads'
        ).get() as any;

        recentActivity = db.prepare(`
            SELECT e.*, l.email as lead_email, g.email as gmail_email
            FROM email_logs e 
            LEFT JOIN leads l ON e.lead_id = l.id 
            LEFT JOIN gmail_accounts g ON e.gmail_id = g.id
            ORDER BY e.timestamp DESC LIMIT 5
        `).all() as any[];

        accountHealth = db.prepare(`
            SELECT email, status, sent_today, daily_limit, is_connected, warmup_enabled
            FROM gmail_accounts
        `).all() as any[];

        trendData = db.prepare(`
            SELECT DATE(timestamp, 'unixepoch') as date, COUNT(*) as sent
            FROM email_logs
            WHERE timestamp >= strftime('%s', 'now', '-7 days')
            GROUP BY date
            ORDER BY date ASC
        `).all() as any[];

    } else {
        gmailAccounts = db.prepare(
            'SELECT COUNT(*) as count FROM gmail_accounts WHERE user_id = ? AND is_connected = 1'
        ).get(user.id) as any;

        campaigns = db.prepare(
            'SELECT COUNT(*) as count FROM campaigns WHERE user_id = ?'
        ).get(user.id) as any;

        sentToday = db.prepare(`
            SELECT COUNT(*) as count FROM email_logs 
            WHERE user_id = ? AND DATE(timestamp, 'unixepoch') = DATE('now')
        `).get(user.id) as any;

        totalSent = db.prepare(
            'SELECT COUNT(*) as count FROM email_logs WHERE user_id = ?'
        ).get(user.id) as any;

        repliedLeads = db.prepare(
            'SELECT COUNT(*) as count FROM leads WHERE user_id = ? AND replied = 1'
        ).get(user.id) as any;

        totalLeads = db.prepare(
            'SELECT COUNT(*) as count FROM leads WHERE user_id = ?'
        ).get(user.id) as any;

        recentActivity = db.prepare(`
            SELECT e.*, l.email as lead_email, g.email as gmail_email
            FROM email_logs e 
            LEFT JOIN leads l ON e.lead_id = l.id 
            LEFT JOIN gmail_accounts g ON e.gmail_id = g.id
            WHERE e.user_id = ?
            ORDER BY e.timestamp DESC LIMIT 5
        `).all(user.id) as any[];

        accountHealth = db.prepare(`
            SELECT email, status, sent_today, daily_limit, is_connected, warmup_enabled
            FROM gmail_accounts WHERE user_id = ?
        `).all(user.id) as any[];

        trendData = db.prepare(`
            SELECT DATE(timestamp, 'unixepoch') as date, COUNT(*) as sent
            FROM email_logs
            WHERE user_id = ? AND timestamp >= strftime('%s', 'now', '-7 days')
            GROUP BY date
            ORDER BY date ASC
        `).all(user.id) as any[];
    }

    const replyRate = totalSent.count > 0
        ? ((repliedLeads.count / totalSent.count) * 100).toFixed(1)
        : '0.0';

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Welcome Header */}
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
                        Welcome back, {user.name || user.email}! 👋
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Here's what's happening with your campaigns today.
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        icon={<Mail className="text-blue-600" size={32} />}
                        title="Connected Accounts"
                        value={gmailAccounts.count}
                        subtitle="Active Gmail accounts"
                        color="blue"
                    />
                    <StatCard
                        icon={<Megaphone className="text-purple-600" size={32} />}
                        title="Campaigns"
                        value={campaigns.count}
                        subtitle="Total campaigns"
                        color="purple"
                    />
                    <StatCard
                        icon={<Send className="text-green-600" size={32} />}
                        title="Sent Today"
                        value={sentToday.count}
                        subtitle={`${totalSent.count} total sent`}
                        color="green"
                    />
                    <StatCard
                        icon={<TrendingUp className="text-orange-600" size={32} />}
                        title="Reply Rate"
                        value={`${replyRate}%`}
                        subtitle={`${repliedLeads.count} / ${totalLeads.count} leads`}
                        color="orange"
                    />
                </div>

                {/* 7-Day Performance Chart & Quick Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <Activity className="text-blue-500" size={24} />
                            <h2 className="text-2xl font-bold tracking-tight text-gray-900">7-Day Sending Trends</h2>
                        </div>
                        <DashboardChartClient rawData={trendData} />
                    </div>

                    <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-6">Quick Actions</h2>
                            <div className="flex flex-col gap-4">
                                <ActionButton
                                    href="/gmail"
                                    title="Connect Gmail"
                                    description="Add a new account"
                                    icon={<Mail size={24} />}
                                />
                                <ActionButton
                                    href="/campaigns"
                                    title="New Campaign"
                                    description="Start sending emails"
                                    icon={<Megaphone size={24} />}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Activity and Health Area */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Recent Activity */}
                    <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Live Activity Timeline</h2>
                            <a href="/logs" className="text-sm font-medium text-blue-600 hover:text-blue-700">View All →</a>
                        </div>
                        <DashboardClient initialActivities={recentActivity} />
                    </div>

                    {/* Account Health */}
                    <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Account Health</h2>
                            <a href="/gmail" className="text-sm font-medium text-blue-600 hover:text-blue-700">Manage →</a>
                        </div>
                        {accountHealth.length === 0 ? (
                            <p className="text-gray-500 text-sm italic">No accounts connected.</p>
                        ) : (
                            <div className="space-y-4">
                                {accountHealth.map((acc: any, i: number) => {
                                    const usage = acc.daily_limit > 0 ? (acc.sent_today / acc.daily_limit) * 100 : 0;
                                    let statusColor = 'bg-gray-500';
                                    if (acc.status === 'active') statusColor = 'bg-green-500';
                                    if (acc.status === 'quota_limit') statusColor = 'bg-red-500';
                                    if (acc.status === 'disconnected') statusColor = 'bg-yellow-500';

                                    return (
                                        <div key={i} className="p-4 border border-gray-100 rounded-xl hover:border-blue-100 transition-colors">
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-2 h-2 rounded-full ${statusColor}`}></span>
                                                    <span className="text-sm font-bold text-gray-900 truncate max-w-[150px]" title={acc.email}>{acc.email}</span>
                                                </div>
                                                <span className="text-xs font-medium text-gray-500 capitalize">{acc.status.replace('_', ' ')}</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2 mb-1">
                                                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${usage}%` }}></div>
                                            </div>
                                            <div className="flex justify-between text-xs text-gray-500 mt-2">
                                                <span>{acc.sent_today} / {acc.daily_limit} limits</span>
                                                {acc.warmup_enabled === 1 && <span className="text-orange-600 font-semibold text-[10px] bg-orange-100 px-2 py-0.5 rounded">🔥 Warmup</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Getting Started (if new user) */}
                {accountHealth.length === 0 && campaigns.count === 0 && (
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border-2 border-blue-200 p-8 shadow-inner">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">🎉 Welcome to AuraSend!</h2>
                        <p className="text-gray-700 mb-6">
                            Get started by connecting your first Gmail account, then create a campaign to start sending.
                        </p>
                        <a
                            href="/gmail"
                            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all shadow-md"
                        >
                            Connect Your First Gmail Account →
                        </a>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

function StatCard({ icon, title, value, subtitle, color }: any) {
    const bgColors: Record<string, string> = {
        blue: 'bg-blue-50',
        purple: 'bg-purple-50',
        green: 'bg-green-50',
        orange: 'bg-orange-50'
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all">
            <div className={`w-14 h-14 rounded-xl ${bgColors[color]} flex items-center justify-center mb-4`}>
                {icon}
            </div>
            <h3 className="text-gray-600 text-sm font-semibold mb-1">{title}</h3>
            <p className="text-3xl font-extrabold text-gray-900 mb-1">{value}</p>
            <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
    );
}

function ActionButton({ href, title, description, icon }: any) {
    return (
        <a
            href={href}
            className="flex items-center gap-4 p-4 bg-gray-50/50 hover:bg-blue-50/80 rounded-2xl border border-gray-100 hover:border-blue-200 transition-all duration-300 group"
        >
            <div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-blue-600 group-hover:scale-110 group-hover:shadow-md group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all duration-300">
                {icon}
            </div>
            <div>
                <h4 className="font-bold text-gray-900">{title}</h4>
                <p className="text-sm text-gray-600">{description}</p>
            </div>
        </a>
    );
}
