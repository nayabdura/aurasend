'use client';

import { useState } from 'react';
import { Users, Mail, Megaphone, Database, Shield, FileText, Trash2, Edit, Plus, Check, X, TrendingUp, Send, Eye, MessageSquare, AlertTriangle, Zap, Activity } from 'lucide-react';
import RichTextEditor from '@/components/RichTextEditor';

export default function AdminClient({ initialUsers, initialGmailAccounts, initialCampaigns, totalLeads, recentLogs, initialBlogs, metrics }: any) {
    const [users, setUsers] = useState(initialUsers);
    const [blogs, setBlogs] = useState(initialBlogs);
    const [tab, setTab] = useState<'overview' | 'users' | 'blog'>('overview');
    const [newBlog, setNewBlog] = useState({ title: '', slug: '', excerpt: '', content: '' });
    const [editUser, setEditUser] = useState<any>(null);
    const [savingUser, setSavingUser] = useState(false);

    async function deleteUser(id: number) {
        if (!confirm('Permanently delete this user and ALL their data?')) return;
        const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
        if (res.ok) {
            setUsers((prev: any[]) => prev.filter((u: any) => u.id !== id));
        } else {
            const err = await res.json();
            alert(err.error || 'Failed to delete user');
        }
    }

    async function updateUser(id: number, updates: any) {
        setSavingUser(true);
        const res = await fetch(`/api/admin/users/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        });
        setSavingUser(false);
        if (res.ok) {
            setUsers((prev: any[]) => prev.map((u: any) => u.id === id ? { ...u, ...updates } : u));
            setEditUser(null);
        } else { alert('Failed to update user'); }
    }

    async function saveBlogPost(e: React.FormEvent) {
        e.preventDefault();
        const res = await fetch('/api/admin/blog', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...newBlog, is_published: true }),
        });
        if (res.ok) { window.location.reload(); } else { alert('Failed to save post'); }
    }

    async function deleteBlog(id: number) {
        if (!confirm('Delete this blog post?')) return;
        const res = await fetch(`/api/admin/blog?id=${id}`, { method: 'DELETE' });
        if (res.ok) setBlogs((prev: any[]) => prev.filter((b: any) => b.id !== id));
    }

    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'users', label: `Users (${users.length})` },
        { id: 'blog', label: `Blog (${blogs.length})` },
    ];

    const m = metrics || {};

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-10 text-white shadow-xl relative overflow-hidden isolate">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-2xl transform-gpu pointer-events-none" />
                <div className="absolute bottom-0 left-1/2 w-96 h-32 bg-blue-500/10 rounded-full blur-2xl transform-gpu pointer-events-none" />
                <div className="flex items-center gap-4 mb-3 relative z-10">
                    <Shield size={40} className="text-indigo-400" />
                    <div>
                        <h1 className="text-4xl font-black tracking-tight">Master Console</h1>
                        <p className="text-slate-400 mt-1">Powered by Abdullah Imran · Outreach Platform Admin</p>
                    </div>
                </div>
                <div className="flex gap-1 mt-8 relative z-10 bg-white dark:bg-zinc-900 p-1 rounded-2xl w-fit">
                    {tabs.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id as any)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === t.id ? 'bg-white dark:bg-zinc-900/60 text-slate-900 dark:text-zinc-50' : 'text-slate-400 hover:text-white'}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Overview Tab */}
            {tab === 'overview' && (
                <div className="space-y-6">
                    {/* Top Stats Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <MetricCard icon={<Users size={22} />} label="Total Users" value={m.totalUsers || users.length} color="indigo" />
                        <MetricCard icon={<Mail size={22} />} label="Connected Inboxes" value={m.totalInboxes || 0} color="blue" />
                        <MetricCard icon={<Megaphone size={22} />} label="Total Campaigns" value={initialCampaigns.length} color="violet" />
                        <MetricCard icon={<Database size={22} />} label="Total Leads" value={m.totalLeads || totalLeads} color="slate" />
                    </div>

                    {/* Activity Stats Row */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <SmallMetric icon={<Activity size={18} />} label="Active Campaigns" value={m.activeCampaigns || 0} badge="running" />
                        <SmallMetric icon={<Send size={18} />} label="Sent Today" value={m.totalSentToday || 0} badge="today" />
                        <SmallMetric icon={<Eye size={18} />} label="Open Rate" value={`${m.openRate || '0.0'}%`} badge="rate" />
                        <SmallMetric icon={<MessageSquare size={18} />} label="Reply Rate" value={`${m.replyRate || '0.0'}%`} badge="rate" />
                        <SmallMetric icon={<AlertTriangle size={18} />} label="Bounce Rate" value={`${m.bounceRate || '0.0'}%`} badge="bounce" />
                        <SmallMetric icon={<Zap size={18} />} label="Warmup Active" value={m.warmupAccounts || 0} badge="warmup" />
                    </div>

                    {/* Campaign + Account Health panels */}
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Recent Campaigns */}
                        <div className="bg-white dark:bg-zinc-900/60 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                            <div className="px-6 py-5 border-b border-slate-100 dark:border-zinc-800/80 flex items-center gap-3">
                                <Megaphone size={18} className="text-indigo-600" />
                                <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-50">Recent Campaigns</h2>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {initialCampaigns.slice(0, 6).map((c: any) => (
                                    <div key={c.id} className="flex items-center justify-between px-6 py-3 hover:bg-slate-50 dark:bg-zinc-900/50 transition-colors">
                                        <div>
                                            <p className="font-semibold text-slate-900 dark:text-zinc-50 text-sm">{c.name}</p>
                                            <p className="text-xs text-slate-400">{c.owner_email}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${c.status === 'running' ? 'bg-emerald-100 text-emerald-700' :
                                            c.status === 'paused' ? 'bg-amber-100 text-amber-700' :
                                                'bg-slate-100 dark:bg-zinc-800/50 text-slate-600 dark:text-zinc-400'
                                            }`}>
                                            {c.status}
                                        </span>
                                    </div>
                                ))}
                                {initialCampaigns.length === 0 && <p className="text-slate-400 text-sm text-center py-8">No campaigns yet.</p>}
                            </div>
                        </div>

                        {/* Account Health */}
                        <div className="bg-white dark:bg-zinc-900/60 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                            <div className="px-6 py-5 border-b border-slate-100 dark:border-zinc-800/80 flex items-center gap-3">
                                <Mail size={18} className="text-indigo-600" />
                                <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-50">Inbox Health</h2>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {initialGmailAccounts.slice(0, 6).map((a: any) => (
                                    <div key={a.id} className="flex items-center justify-between px-6 py-3 hover:bg-slate-50 dark:bg-zinc-900/50 transition-colors">
                                        <div>
                                            <p className="font-semibold text-slate-900 dark:text-zinc-50 text-sm truncate max-w-[180px]">{a.email}</p>
                                            <p className="text-xs text-slate-400">{a.sent_today}/{a.daily_limit} today · {a.owner_email}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {a.warmup_enabled === 1 && <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded font-bold">🔥 Warmup</span>}
                                            <span className={`w-2 h-2 rounded-full ${a.status === 'active' ? 'bg-emerald-400' : a.status === 'quota_limit' ? 'bg-red-400' : 'bg-slate-300'}`} />
                                        </div>
                                    </div>
                                ))}
                                {initialGmailAccounts.length === 0 && <p className="text-slate-400 text-sm text-center py-8">No accounts connected.</p>}
                            </div>
                        </div>
                    </div>

                    {/* System Logs */}
                    {recentLogs && recentLogs.length > 0 && (
                        <div className="bg-white dark:bg-zinc-900/60 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                            <div className="px-6 py-5 border-b border-slate-100 dark:border-zinc-800/80 flex items-center gap-3">
                                <TrendingUp size={18} className="text-indigo-600" />
                                <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-50">Recent Activity Logs</h2>
                            </div>
                            <div className="divide-y divide-slate-50 max-h-64 overflow-y-auto">
                                {recentLogs.slice(0, 15).map((l: any) => (
                                    <div key={l.id} className="px-6 py-2.5 flex items-start gap-3 hover:bg-slate-50 dark:bg-zinc-900/50 transition-colors">
                                        <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${l.level === 'error' ? 'bg-red-400' : l.level === 'success' ? 'bg-emerald-400' : 'bg-blue-400'}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-slate-700 dark:text-zinc-300 truncate">{l.message}</p>
                                            <p className="text-[10px] text-slate-400">{l.created_at}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Users Tab */}
            {tab === 'users' && (
                <div className="bg-white dark:bg-zinc-900/60 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                    <div className="px-8 py-6 border-b border-slate-100 dark:border-zinc-800/80 flex items-center gap-3">
                        <Users size={20} className="text-indigo-600" />
                        <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-50">User Management</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 dark:bg-zinc-900/50 border-b border-slate-200 dark:border-zinc-800">
                                <tr>
                                    {['ID', 'Email', 'Name', 'Plan', 'Role', 'Joined', 'Actions'].map(h => (
                                        <th key={h} className="text-left p-4 font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider text-xs">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {users.map((u: any) => (
                                    <tr key={u.id} className="hover:bg-slate-50 dark:bg-zinc-900/50 transition-colors">
                                        <td className="p-4 font-mono text-xs text-slate-400">{u.id}</td>
                                        <td className="p-4 font-semibold text-slate-900 dark:text-zinc-50">{u.email}</td>
                                        <td className="p-4 text-slate-600 dark:text-zinc-400">{u.name || '—'}</td>
                                        <td className="p-4">
                                            {editUser?.id === u.id ? (
                                                <select
                                                    value={editUser.plan || 'free'}
                                                    onChange={e => setEditUser({ ...editUser, plan: e.target.value })}
                                                    className="border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-zinc-50"
                                                >
                                                    <option value="free">Free</option>
                                                    <option value="starter">Starter</option>
                                                    <option value="unlimited">Unlimited</option>
                                                </select>
                                            ) : (
                                                <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${u.plan === 'unlimited' ? 'bg-indigo-100 text-indigo-700' :
                                                    u.plan === 'starter' ? 'bg-emerald-100 text-emerald-700' :
                                                        'bg-slate-100 dark:bg-zinc-800/50 text-slate-600 dark:text-zinc-400'
                                                    }`}>
                                                    {u.plan || 'free'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase ${u.role === 'master' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 dark:bg-zinc-800/50 text-slate-600 dark:text-zinc-400'}`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="p-4 text-xs text-slate-400">
                                            {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                {editUser?.id === u.id ? (
                                                    <>
                                                        <button onClick={() => updateUser(u.id, { plan: editUser.plan })} disabled={savingUser} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><Check size={14} /></button>
                                                        <button onClick={() => setEditUser(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 dark:bg-zinc-800/50 rounded-lg transition-colors"><X size={14} /></button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button onClick={() => setEditUser(u)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit plan"><Edit size={14} /></button>
                                                        {u.role !== 'master' && (
                                                            <button onClick={() => deleteUser(u.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Delete user"><Trash2 size={14} /></button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Blog Tab */}
            {tab === 'blog' && (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-zinc-900/60 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-100 dark:border-zinc-800/80 flex items-center gap-3">
                            <FileText size={20} className="text-indigo-600" />
                            <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-50">Blog Posts ({blogs.length})</h2>
                        </div>
                        {blogs.length === 0 ? (
                            <p className="text-slate-400 text-center py-12">No posts yet. Write your first post below.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 dark:bg-zinc-900/50 border-b border-slate-200 dark:border-zinc-800">
                                        <tr>{['Title', 'Slug', 'Date', 'Status', 'Actions'].map(h => <th key={h} className="text-left p-4 font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider text-xs">{h}</th>)}</tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {blogs.map((b: any) => (
                                            <tr key={b.id} className="hover:bg-slate-50 dark:bg-zinc-900/50">
                                                <td className="p-4 font-semibold text-slate-900 dark:text-zinc-50 max-w-xs truncate">{b.title}</td>
                                                <td className="p-4 font-mono text-xs text-slate-500 dark:text-zinc-400">{b.slug}</td>
                                                <td className="p-4 text-xs text-slate-400">{new Date(b.created_at).toLocaleDateString()}</td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${b.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 dark:bg-zinc-800/50 text-slate-600 dark:text-zinc-400'}`}>
                                                        {b.is_published ? 'Live' : 'Draft'}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <a href={`/blog/${b.slug}`} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline">Preview</a>
                                                        <button onClick={() => deleteBlog(b.id)} className="p-1.5 text-rose-400 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Write New Post */}
                    <div className="bg-white dark:bg-zinc-900/60 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-100 dark:border-zinc-800/80 flex items-center gap-3">
                            <Plus size={20} className="text-indigo-600" />
                            <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-50">Write New Post</h2>
                        </div>
                        <form onSubmit={saveBlogPost} className="p-8 space-y-5">
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-zinc-300 mb-2">Title</label>
                                    <input
                                        placeholder="How to Write Cold Emails That Get Replies"
                                        value={newBlog.title}
                                        onChange={e => setNewBlog({ ...newBlog, title: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })}
                                        className="w-full h-12 px-4 border border-slate-300 rounded-xl text-slate-900 dark:text-zinc-50 outline-none focus:ring-2 focus:ring-indigo-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-zinc-300 mb-2">URL Slug</label>
                                    <input
                                        placeholder="how-to-write-cold-emails"
                                        value={newBlog.slug}
                                        onChange={e => setNewBlog({ ...newBlog, slug: e.target.value })}
                                        className="w-full h-12 px-4 border border-slate-300 rounded-xl text-slate-900 dark:text-zinc-50 outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-zinc-300 mb-2">Excerpt</label>
                                <textarea
                                    placeholder="A short summary shown in the blog list..."
                                    value={newBlog.excerpt}
                                    onChange={e => setNewBlog({ ...newBlog, excerpt: e.target.value })}
                                    className="w-full p-4 border border-slate-300 rounded-xl text-slate-900 dark:text-zinc-50 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                    rows={2}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-zinc-300 mb-2">Content <span className="text-slate-400 font-normal">(Images supported)</span></label>
                                <RichTextEditor
                                    value={newBlog.content}
                                    onChange={(val: string) => setNewBlog({ ...newBlog, content: val })}
                                    placeholder="Write your blog post here..."
                                    height="400px"
                                />
                            </div>
                            <button type="submit" className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors">
                                Publish Post
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function MetricCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
    const colors: Record<string, string> = {
        indigo: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-500/20',
        blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20',
        violet: 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-100 dark:border-violet-500/20',
        slate: 'bg-slate-50 dark:bg-zinc-900/50 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800',
    };
    return (
        <div className="bg-white dark:bg-zinc-900/60 rounded-3xl border border-slate-200 dark:border-zinc-800 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 border ${colors[color] || colors.slate}`}>{icon}</div>
            <p className="text-slate-500 dark:text-zinc-400 text-sm font-semibold mb-1">{label}</p>
            <p className="text-3xl font-black text-slate-900 dark:text-zinc-50 tracking-tight">{typeof value === 'number' ? value.toLocaleString() : value}</p>
        </div>
    );
}

function SmallMetric({ icon, label, value, badge }: { icon: React.ReactNode; label: string; value: string | number; badge: string }) {
    const badgeStyle: Record<string, string> = {
        running: 'text-emerald-600',
        today: 'text-blue-600',
        rate: 'text-indigo-600',
        bounce: 'text-rose-600',
        warmup: 'text-orange-600',
    };
    return (
        <div className="bg-white dark:bg-zinc-900/60 rounded-2xl border border-slate-200 dark:border-zinc-800 p-5 shadow-sm">
            <div className={`flex items-center gap-2 mb-2 ${badgeStyle[badge] || 'text-slate-600 dark:text-zinc-400'}`}>{icon}<span className="text-xs font-bold uppercase tracking-wider">{label}</span></div>
            <p className="text-2xl font-black text-slate-900 dark:text-zinc-50">{value}</p>
        </div>
    );
}
