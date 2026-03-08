import DashboardLayout from '@/components/DashboardLayout';
import { requireAuth } from '@/lib/auth';
import { Globe, ShieldCheck, ShieldAlert, CheckCircle, Search, Trash2, PlusCircle, AlertTriangle } from 'lucide-react';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function DomainsHealthCenter() {
    const user = await requireAuth();

    // Fetch domains based on role
    const query = user.role === 'master'
        ? 'SELECT d.*, w.name as workspace_name FROM domains d LEFT JOIN workspaces w ON d.workspace_id = w.id ORDER BY d.health_score ASC'
        : 'SELECT * FROM domains WHERE workspace_id = ? ORDER BY health_score ASC';

    const domains = user.role === 'master'
        ? db.prepare(query).all()
        : db.prepare(query).all(user.workspace_id || 1);

    const stats = {
        total: domains.length,
        critical: domains.filter((d: any) => d.health_score < 70).length,
        healthy: domains.filter((d: any) => d.health_score >= 90).length,
        safe_mode: domains.filter((d: any) => d.is_safe_mode === 1).length
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 shadow-2xl text-white">
                    <h1 className="text-4xl font-extrabold mb-2 flex items-center gap-3">
                        <Globe size={40} /> Domains & DNS
                    </h1>
                    <p className="text-blue-100 text-lg">Monitor SPF, DKIM, and DMARC health to protect your sender reputation.</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <StatCard icon={<Globe />} title="Total Domains" value={stats.total} color="blue" />
                    <StatCard icon={<ShieldCheck />} title="Healthy Domains" value={stats.healthy} subtitle="Health > 90%" color="green" />
                    <StatCard icon={<AlertTriangle />} title="Critical Risk" value={stats.critical} subtitle="Requires Action" color="red" />
                    <StatCard icon={<ShieldAlert />} title="Safe Mode Paused" value={stats.safe_mode} color="orange" />
                </div>

                {/* Main Content Area */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                        <div className="relative w-96">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search tracking domain..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors shadow-md">
                            <PlusCircle size={18} /> Verify Domain DNS
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left bg-white">
                            <thead className="bg-gray-100 text-gray-600 font-semibold text-sm">
                                <tr>
                                    <th className="py-4 px-6">Domain</th>
                                    <th className="py-4 px-6">Health Score</th>
                                    <th className="py-4 px-6">DNS Records</th>
                                    {user.role === 'master' && <th className="py-4 px-6">Workspace</th>}
                                    <th className="py-4 px-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-gray-700 text-sm">
                                {domains.length === 0 ? (
                                    <tr>
                                        <td colSpan={user.role === 'master' ? 5 : 4} className="py-12 text-center text-gray-500">
                                            No domains attached. Connect Gmail accounts or manually add a checking domain.
                                        </td>
                                    </tr>
                                ) : (
                                    domains.map((d: any) => (
                                        <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="py-4 px-6 font-bold text-gray-900">{d.domain_name}</td>
                                            <td className="py-4 px-6">
                                                <ScoreBadge score={d.health_score} />
                                            </td>
                                            <td className="py-4 px-6 flex gap-2">
                                                <small className={`px-2 py-0.5 rounded font-bold ${d.spf_status === 'pass' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>SPF</small>
                                                <small className={`px-2 py-0.5 rounded font-bold ${d.dkim_status === 'pass' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>DKIM</small>
                                                <small className={`px-2 py-0.5 rounded font-bold ${d.dmarc_status === 'pass' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>DMARC</small>
                                            </td>
                                            {user.role === 'master' && (
                                                <td className="py-4 px-6 text-gray-500">{d.workspace_name || 'Global'}</td>
                                            )}
                                            <td className="py-4 px-6 text-right flex justify-end gap-2">
                                                <button className="px-3 py-1 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded text-xs font-semibold">Rescan</button>
                                                <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                    <Trash2 size={16} />
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
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        green: 'bg-green-50 text-green-600 border-green-100',
        red: 'bg-red-50 text-red-600 border-red-100',
        orange: 'bg-orange-50 text-orange-600 border-orange-100'
    };

    return (
        <div className={`p-6 rounded-2xl border ${colorMap[color]} flex items-center gap-4`}>
            <div className={`p-4 bg-white rounded-xl shadow-sm ${colorMap[color].split(' ')[1]}`}>
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

function ScoreBadge({ score }: { score: number }) {
    if (score >= 90) return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-black border border-green-200">{score}%</span>;
    if (score >= 70) return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-black border border-yellow-200">{score}%</span>;
    return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-black border border-red-200">{score}%</span>;
}
