import DashboardLayout from '@/components/DashboardLayout';
import { requireAuth } from '@/lib/auth';
import { Mail, Megaphone, Send, TrendingUp, Activity } from 'lucide-react';
import DashboardClient from './DashboardClient';
import dynamic from 'next/dynamic';
import DashboardService from '@/backend/services/DashboardService';

const DashboardChartClient = dynamic(() => import('@/app/dashboard/DashboardChartClient'), { ssr: false });

export default async function DashboardPage() {
    const user = await requireAuth();
    const stats = await DashboardService.getDashboardStats(user.id, user.role);

    const {
        gmailAccounts,
        campaigns,
        sentToday,
        totalSent,
        repliedLeads,
        totalLeads,
        recentActivity,
        accountHealth,
        trendData
    } = stats;

    const replyRate = totalSent.count > 0
        ? ((repliedLeads.count / totalSent.count) * 100).toFixed(1)
        : '0.0';

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Welcome Header */}
                <div className="mb-6">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-zinc-50 tracking-tight mb-2">
                        Welcome back, {user.name || user.email}! 👋
                    </h1>
                    <p className="text-slate-500 dark:text-zinc-50 text-lg">
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
                    <div className="lg:col-span-2 bg-white dark:bg-zinc-900/60 dark:bg-zinc-900/40 rounded-3xl shadow-sm border border-slate-200 dark:border-zinc-800/60 dark:border-zinc-800 p-8 transition-all duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <Activity className="text-blue-500" size={24} />
                            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">7-Day Sending Trends</h2>
                        </div>
                        <DashboardChartClient rawData={trendData} />
                    </div>

                    <div className="bg-white dark:bg-zinc-900/60 dark:bg-zinc-900/40 rounded-3xl shadow-sm border border-slate-200 dark:border-zinc-800/60 dark:border-zinc-800 p-8 flex flex-col justify-between transition-all duration-300">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50 mb-6">Quick Actions</h2>
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
                    <div className="bg-white dark:bg-zinc-900/60 dark:bg-zinc-900/40 rounded-3xl shadow-sm border border-slate-200 dark:border-zinc-800/60 dark:border-zinc-800 p-8 transition-all duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-50">Live Activity Timeline</h2>
                            <a href="/logs" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700">View All →</a>
                        </div>
                        <DashboardClient initialActivities={recentActivity} />
                    </div>

                    {/* Account Health */}
                    <div className="bg-white dark:bg-zinc-900/60 dark:bg-zinc-900/40 rounded-3xl shadow-sm border border-slate-200 dark:border-zinc-800/60 dark:border-zinc-800 p-8 transition-all duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-50">Account Health</h2>
                            <a href="/gmail" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700">Manage →</a>
                        </div>
                        {accountHealth.length === 0 ? (
                            <p className="text-slate-500 dark:text-zinc-50 text-sm italic">No accounts connected.</p>
                        ) : (
                            <div className="space-y-4">
                                {accountHealth.map((acc: any, i: number) => {
                                    const usage = acc.daily_limit > 0 ? (acc.sent_today / acc.daily_limit) * 100 : 0;
                                    let statusColor = 'bg-slate-50 dark:bg-zinc-900/50 dark:bg-zinc-900/300';
                                    if (acc.status === 'active') statusColor = 'bg-emerald-500';
                                    if (acc.status === 'quota_limit') statusColor = 'bg-rose-500';
                                    if (acc.status === 'disconnected') statusColor = 'bg-amber-500';

                                    return (
                                        <div key={i} className="p-4 border border-slate-100 dark:border-zinc-800/80 dark:border-zinc-800/80 rounded-2xl hover:border-blue-200 dark:hover:border-blue-900/50 transition-colors bg-slate-50 dark:bg-zinc-900/50/50 dark:bg-zinc-800/20">
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-2 h-2 rounded-full ${statusColor}`}></span>
                                                    <span className="text-sm font-bold text-slate-900 dark:text-zinc-50 truncate max-w-[150px]" title={acc.email}>{acc.email}</span>
                                                </div>
                                                <span className="text-xs font-medium text-slate-500 dark:text-zinc-50 capitalize">{acc.status.replace('_', ' ')}</span>
                                            </div>
                                            <div className="w-full bg-slate-200 dark:bg-zinc-800 rounded-full h-1.5 mb-1.5 overflow-hidden">
                                                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${usage}%` }}></div>
                                            </div>
                                            <div className="flex justify-between text-xs text-slate-500 dark:text-zinc-50 mt-2 font-medium">
                                                <span>{acc.sent_today} / {acc.daily_limit} limits</span>
                                                {acc.warmup_enabled === 1 && <span className="text-orange-600 dark:text-orange-400 font-semibold text-[10px] bg-orange-100 dark:bg-orange-500/10 px-2 py-0.5 rounded-md">🔥 Warmup</span>}
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
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-3xl border border-blue-200/50 dark:border-blue-800/30 p-8">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-50 mb-3 tracking-tight">🎉 Welcome to AuraSend!</h2>
                        <p className="text-slate-600 dark:text-zinc-50 mb-6 text-lg">
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
        blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
        purple: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400',
        green: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        orange: 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400'
    };

    return (
        <div className="bg-white dark:bg-zinc-900/60 dark:bg-zinc-900/50 rounded-3xl shadow-sm border border-slate-200 dark:border-zinc-800/60 dark:border-zinc-800/80 p-6 transition-all">
            <div className={`w-14 h-14 rounded-2xl ${bgColors[color]} flex items-center justify-center mb-5 shadow-sm`}>
                {icon}
            </div>
            <h3 className="text-slate-500 dark:text-zinc-50 text-sm font-semibold mb-1 tracking-wide uppercase">{title}</h3>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-zinc-50 mb-1 tracking-tight">{value}</p>
            <p className="text-xs text-slate-500 dark:text-zinc-50 font-medium">{subtitle}</p>
        </div>
    );
}

function ActionButton({ href, title, description, icon }: any) {
    return (
        <a
            href={href}
            className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-zinc-900/50/50 dark:bg-zinc-800/20 hover:bg-blue-50/80 dark:hover:bg-blue-900/20 rounded-2xl border border-slate-100 dark:border-zinc-800/80 dark:border-zinc-800/80 hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-300 group"
        >
            <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-900/60 dark:bg-zinc-800 shadow-sm border border-slate-100 dark:border-zinc-800/80 dark:border-zinc-700 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 group-hover:shadow-md group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all duration-300">
                {icon}
            </div>
            <div>
                <h4 className="font-bold text-slate-900 dark:text-zinc-50 tracking-tight">{title}</h4>
                <p className="text-sm text-slate-500 dark:text-zinc-50">{description}</p>
            </div>
        </a>
    );
}
