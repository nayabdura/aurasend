'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Mail, Users, CheckCircle, XCircle, Eye, Reply, Zap, ArrowUpRight } from 'lucide-react';

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.4 } })
};

export default function AnalyticsPage() {
    const [stats, setStats] = useState<any>(null);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAnalytics();
    }, []);

    async function loadAnalytics() {
        try {
            const [statsRes, campaignsRes] = await Promise.all([
                fetch('/api/analytics/stats'),
                fetch('/api/campaigns')
            ]);
            setStats(await statsRes.json());
            setCampaigns(await campaignsRes.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <div className="p-8 text-center">Loading analytics...</div>;

    const openRate = stats?.total_sent > 0 ? ((stats.total_opened / stats.total_sent) * 100).toFixed(1) : 0;
    const replyRate = stats?.total_sent > 0 ? ((stats.total_replied / stats.total_sent) * 100).toFixed(1) : 0;
    const bounceRate = stats?.total_sent > 0 ? ((stats.total_bounced / stats.total_sent) * 100).toFixed(1) : 0;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp} className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 rounded-3xl p-10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white dark:bg-zinc-900/60 opacity-5 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-400 opacity-20 rounded-full translate-y-1/3 -translate-x-1/4 blur-3xl"></div>
                <div className="relative z-10">
                    <h1 className="text-4xl font-extrabold mb-3 flex items-center gap-4 tracking-tight">
                        <BarChart3 size={40} className="text-indigo-200" /> Analytics Dashboard
                    </h1>
                    <p className="text-indigo-100 text-lg max-w-xl">Deep dive into your campaign performance, track engagement, and optimize your cold outreach strategy.</p>
                </div>
            </motion.div>

            {/* Key Metrics */}
            <motion.div initial="hidden" animate="visible" custom={1} variants={fadeUp} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    icon={<Mail className="text-blue-600" size={28} />}
                    title="Total Sent"
                    value={stats?.total_sent || 0}
                    bgColor="bg-blue-50/50"
                    iconBg="bg-blue-100"
                    borderColor="border-blue-100"
                />
                <MetricCard
                    icon={<Eye className="text-green-600" size={28} />}
                    title="Opened"
                    value={stats?.total_opened || 0}
                    subtitle={`${openRate}% open rate`}
                    bgColor="bg-green-50/50"
                    iconBg="bg-green-100"
                    borderColor="border-green-100"
                />
                <MetricCard
                    icon={<Reply className="text-purple-600" size={28} />}
                    title="Replied"
                    value={stats?.total_replied || 0}
                    subtitle={`${replyRate}% reply rate`}
                    bgColor="bg-purple-50/50"
                    iconBg="bg-purple-100"
                    borderColor="border-purple-100"
                />
                <MetricCard
                    icon={<XCircle className="text-red-600" size={28} />}
                    title="Bounced"
                    value={stats?.total_bounced || 0}
                    subtitle={`${bounceRate}% bounce rate`}
                    bgColor="bg-red-50/50"
                    iconBg="bg-red-100"
                    borderColor="border-red-100"
                />
            </motion.div>

            {/* Lead Status Breakdown & Performance Tips */}
            <motion.div initial="hidden" animate="visible" custom={2} variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-zinc-900/60 p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-zinc-800/80 dark:border-zinc-800/80 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-slate-900 dark:text-zinc-50 tracking-tight">
                        <Users size={28} className="text-indigo-500" /> Lead Status Breakdown
                    </h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatusCard label="Pending" count={stats?.pending || 0} color="text-yellow-600" bg="bg-yellow-50/50" border="border-yellow-100" />
                        <StatusCard label="Sent" count={stats?.sent || 0} color="text-blue-600" bg="bg-blue-50/50" border="border-blue-100" />
                        <StatusCard label="Invalid" count={stats?.invalid || 0} color="text-red-600" bg="bg-red-50/50" border="border-red-100" />
                        <StatusCard label="Bounced" count={stats?.bounced || 0} color="text-orange-600" bg="bg-orange-50/50" border="border-orange-100" />
                    </div>
                </div>

                {/* Performance Tips */}
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-8 rounded-3xl border border-yellow-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    <h3 className="font-bold text-xl mb-4 flex items-center gap-3 tracking-tight">
                        <Zap className="text-yellow-600 fill-yellow-600" size={26} /> Performance Tips
                    </h3>
                    <ul className="space-y-4 text-sm text-slate-700 dark:text-zinc-50">
                        <li className="flex items-start gap-3">
                            <span className="bg-green-100 p-1 rounded-full text-green-700 mt-0.5"><ArrowUpRight size={14} /></span>
                            <div><strong>Open Rate {'>'}20%:</strong> Excellent! Your subject lines are working.</div>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="bg-purple-100 p-1 rounded-full text-purple-700 mt-0.5"><ArrowUpRight size={14} /></span>
                            <div><strong>Reply Rate {'>'}5%:</strong> Great engagement! Keep personalizing.</div>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="bg-red-100 p-1 rounded-full text-red-700 mt-0.5"><XCircle size={14} /></span>
                            <div><strong>Bounce Rate {'>'}5%:</strong> Consider using email verification.</div>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="bg-blue-100 p-1 rounded-full text-blue-700 mt-0.5"><Zap size={14} className="fill-blue-700" /></span>
                            <div><strong>A/B Test:</strong> Test different templates to improve overall performance.</div>
                        </li>
                    </ul>
                </div>
            </motion.div>

            {/* Campaign Performance Table */}
            <motion.div initial="hidden" animate="visible" custom={3} variants={fadeUp} className="bg-white dark:bg-zinc-900/60 p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-zinc-800/80 dark:border-zinc-800/80 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-slate-900 dark:text-zinc-50 tracking-tight">
                    <TrendingUp size={28} className="text-green-500" /> Campaign Performance
                </h2>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-zinc-900/50 dark:bg-zinc-900/30 border-b-2 border-slate-200 dark:border-zinc-800 dark:border-zinc-800">
                            <tr>
                                <th className="text-left p-3 font-semibold text-slate-700 dark:text-zinc-50">Campaign</th>
                                <th className="text-center p-3 font-semibold text-slate-700 dark:text-zinc-50">Status</th>
                                <th className="text-center p-3 font-semibold text-slate-700 dark:text-zinc-50">Leads</th>
                                <th className="text-center p-3 font-semibold text-slate-700 dark:text-zinc-50">Sent</th>
                                <th className="text-center p-3 font-semibold text-slate-700 dark:text-zinc-50">Opened</th>
                                <th className="text-center p-3 font-semibold text-slate-700 dark:text-zinc-50">Replied</th>
                            </tr>
                        </thead>
                        <tbody>
                            {campaigns.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-gray-400">No campaigns yet</td>
                                </tr>
                            ) : (
                                campaigns.map(c => (
                                    <tr key={c.id} className="border-b border-slate-100 dark:border-zinc-800/80 dark:border-zinc-800/80 hover:bg-slate-50 dark:bg-zinc-900/50 dark:bg-zinc-900/30">
                                        <td className="p-3 font-medium">{c.name}</td>
                                        <td className="p-3 text-center">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${c.status === 'running' ? 'bg-green-100 text-green-700' : 'bg-slate-100 dark:bg-zinc-800/50 dark:bg-zinc-800/50 text-slate-700 dark:text-zinc-50'}`}>
                                                {c.status}
                                            </span>
                                        </td>
                                        <td className="p-3 text-center">{c.lead_count || 0}</td>
                                        <td className="p-3 text-center">{c.sent_count || 0}</td>
                                        <td className="p-3 text-center">{c.opened_count || 0}</td>
                                        <td className="p-3 text-center">{c.replied_count || 0}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
}

function MetricCard({ icon, title, value, subtitle, bgColor, iconBg, borderColor }: any) {
    return (
        <div className={`${bgColor} p-6 rounded-3xl border ${borderColor} hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all flex flex-col justify-between min-h-[140px]`}>
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-slate-600 dark:text-zinc-50 tracking-tight">{title}</h3>
                <div className={`${iconBg} p-2 rounded-xl`}>{icon}</div>
            </div>
            <div>
                <span className="text-4xl font-extrabold text-slate-900 dark:text-zinc-50 tracking-tight">{value.toLocaleString()}</span>
                {subtitle && <p className="text-sm font-medium text-slate-500 dark:text-zinc-50 mt-1">{subtitle}</p>}
            </div>
        </div>
    );
}

function StatusCard({ label, count, color, bg, border }: any) {
    return (
        <div className={`${bg} p-6 rounded-2xl border ${border} text-center hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all`}>
            <p className={`text-3xl font-extrabold ${color} tracking-tight`}>{count.toLocaleString()}</p>
            <p className="text-sm font-semibold text-slate-600 dark:text-zinc-50 mt-1 uppercase tracking-wider">{label}</p>
        </div>
    );
}
