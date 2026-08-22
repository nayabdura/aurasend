import DashboardLayout from '@/components/DashboardLayout';
import { requireAuth } from '@/lib/auth';
import { Ban, ShieldAlert, CheckCircle, Search, Trash2, PlusCircle, Globe, Mail } from 'lucide-react';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function SuppressionCenter() {
    const user = await requireAuth();

    // Fetch suppressions based on role (Master sees all, Users see their workspace)
    const query = user.role === 'master'
        ? 'SELECT s.*, w.name as workspace_name FROM suppressions s LEFT JOIN workspaces w ON s.workspace_id = w.id ORDER BY s.created_at DESC'
        : 'SELECT * FROM suppressions WHERE workspace_id = ? ORDER BY created_at DESC';

    const suppressions = user.role === 'master'
        ? db.prepare(query).all()
        : db.prepare(query).all(user.workspace_id || 1);

    const stats = {
        total: suppressions.length,
        bounces: suppressions.filter((s: any) => s.reason === 'hard_bounce').length,
        unsubscribes: suppressions.filter((s: any) => s.reason === 'unsubscribed').length,
        manual: suppressions.filter((s: any) => s.reason === 'manual_block').length
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-600 to-rose-600 rounded-2xl p-8 shadow-2xl text-white">
                    <h1 className="text-4xl font-extrabold mb-2 flex items-center gap-3">
                        <Ban size={40} /> Suppression Center
                    </h1>
                    <p className="text-red-100 text-lg">Manage blocklists, hard bounces, and unsubscribes across your workspace.</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <StatCard icon={<Ban />} title="Total Blocked" value={stats.total} color="red" />
                    <StatCard icon={<Mail />} title="Unsubscribes" value={stats.unsubscribes} subtitle="CAN-SPAM" color="orange" />
                    <StatCard icon={<ShieldAlert />} title="Hard Bounces" value={stats.bounces} color="purple" />
                    <StatCard icon={<Globe />} title="Manual Blocks" value={stats.manual} color="gray" />
                </div>

                {/* Main Content Area */}
                <div className="bg-white dark:bg-zinc-900/60 rounded-xl shadow-lg border border-slate-200 dark:border-zinc-800 dark:border-zinc-800 overflow-hidden">
                    <div className="p-6 border-b border-slate-200 dark:border-zinc-800 dark:border-zinc-800 flex justify-between items-center bg-slate-50 dark:bg-zinc-900/50 dark:bg-zinc-900/30">
                        <div className="relative w-96">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search email or domain..."
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                            />
                        </div>
                        <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors">
                            <PlusCircle size={18} /> Add Block
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left bg-white dark:bg-zinc-900/60">
                            <thead className="bg-slate-100 dark:bg-zinc-800/50 dark:bg-zinc-800/50 text-slate-600 dark:text-zinc-50 font-semibold text-sm">
                                <tr>
                                    <th className="py-4 px-6">Domain / Email</th>
                                    <th className="py-4 px-6">Reason</th>
                                    <th className="py-4 px-6">Date Added</th>
                                    {user.role === 'master' && <th className="py-4 px-6">Workspace</th>}
                                    <th className="py-4 px-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-slate-700 dark:text-zinc-50 text-sm">
                                {suppressions.length === 0 ? (
                                    <tr>
                                        <td colSpan={user.role === 'master' ? 5 : 4} className="py-12 text-center text-slate-500 dark:text-zinc-50">
                                            No blocks found. Your lists are clean!
                                        </td>
                                    </tr>
                                ) : (
                                    suppressions.map((s: any) => (
                                        <tr key={s.id} className="hover:bg-slate-50 dark:bg-zinc-900/50 dark:bg-zinc-900/30 transition-colors">
                                            <td className="py-4 px-6 font-medium text-slate-900 dark:text-zinc-50">{s.domain_or_email}</td>
                                            <td className="py-4 px-6">
                                                <Badge reason={s.reason} />
                                            </td>
                                            <td className="py-4 px-6 text-slate-500 dark:text-zinc-50">{new Date(s.created_at).toLocaleDateString()}</td>
                                            {user.role === 'master' && (
                                                <td className="py-4 px-6 text-slate-500 dark:text-zinc-50">{s.workspace_name || 'Global'}</td>
                                            )}
                                            <td className="py-4 px-6 text-right">
                                                <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

function StatCard({ icon, title, value, subtitle, color }: any) {
    const colorMap: any = {
        red: 'bg-red-50 text-red-600 border-red-100',
        orange: 'bg-orange-50 text-orange-600 border-orange-100',
        purple: 'bg-purple-50 text-purple-600 border-purple-100',
        gray: 'bg-slate-50 dark:bg-zinc-900/50 dark:bg-zinc-900/30 text-slate-600 dark:text-zinc-50 border-slate-200 dark:border-zinc-800 dark:border-zinc-800'
    };

    return (
        <div className={`p-6 rounded-2xl border ${colorMap[color]} flex items-center gap-4`}>
            <div className={`p-4 bg-white dark:bg-zinc-900/60 rounded-xl shadow-sm ${colorMap[color].split(' ')[1]}`}>
                {icon}
            </div>
            <div>
                <p className="text-xs font-bold uppercase tracking-wider opacity-80">{title}</p>
                <p className="text-2xl font-black">{value}</p>
                {subtitle && <p className="text-xs opacity-75 mt-0.5">{subtitle}</p>}
            </div>
        </div>
    );
}

function Badge({ reason }: { reason: string }) {
    if (reason === 'hard_bounce') return <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold uppercase">Hard Bounce</span>;
    if (reason === 'unsubscribed') return <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold uppercase">Unsubscribed</span>;
    return <span className="px-3 py-1 bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-50 rounded-full text-xs font-bold uppercase">Manual block</span>;
}
