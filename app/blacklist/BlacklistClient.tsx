'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Ban, Trash2, Plus, AlertTriangle } from 'lucide-react';

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.4 } })
};

export default function BlacklistPage() {
    const [blacklist, setBlacklist] = useState<any[]>([]);
    const [newEmail, setNewEmail] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBlacklist();
    }, []);

    async function loadBlacklist() {
        const res = await fetch('/api/blacklist');
        const data = await res.json();
        setBlacklist(data);
        setLoading(false);
    }

    async function addToBlacklist() {
        if (!newEmail.trim()) return alert('Enter an email');

        await fetch('/api/blacklist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: newEmail, reason: 'manual' })
        });

        setNewEmail('');
        loadBlacklist();
    }

    async function removeFromBlacklist(id: number) {
        if (!confirm('Remove from blacklist?')) return;
        await fetch(`/api/blacklist?id=${id}`, { method: 'DELETE' });
        loadBlacklist();
    }

    async function syncBounced() {
        if (!confirm('Add all bounced emails to blacklist?')) return;
        await fetch('/api/blacklist/sync-bounced', { method: 'POST' });
        loadBlacklist();
    }

    if (loading) return <div className="p-8 text-center text-slate-500 dark:text-zinc-50">Loading blacklist...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp} className="bg-gradient-to-br from-red-600 to-rose-700 rounded-3xl p-10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white dark:bg-zinc-900/60 opacity-5 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl"></div>
                <div className="relative z-10">
                    <h1 className="text-4xl font-extrabold mb-3 flex items-center gap-4 tracking-tight">
                        <Shield size={40} className="text-red-200" /> Blacklist Manager
                    </h1>
                    <p className="text-red-100 text-lg max-w-xl">Manage blocked and bounced email addresses. Prevent accidental outreach to invalid or opted-out leads.</p>
                </div>
            </motion.div>

            {/* Add Email */}
            <motion.div initial="hidden" animate="visible" custom={1} variants={fadeUp} className="bg-white dark:bg-zinc-900/60 p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-zinc-800/80 dark:border-zinc-800/80 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
                <h2 className="text-xl font-extrabold mb-6 flex items-center gap-2 tracking-tight text-slate-900 dark:text-zinc-50">
                    <Plus size={24} className="text-red-500 bg-red-50 p-1 flex-shrink-0 rounded-lg" /> Add Email to Blacklist
                </h2>
                <div className="flex flex-col md:flex-row gap-4">
                    <input
                        type="email"
                        placeholder="email@example.com"
                        value={newEmail}
                        onChange={e => setNewEmail(e.target.value)}
                        className="flex-1 px-5 py-3 border border-slate-200 dark:border-zinc-800 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-red-500 outline-none transition-all placeholder:text-gray-400"
                    />
                    <div className="flex gap-3">
                        <button
                            onClick={addToBlacklist}
                            className="px-6 py-3 bg-red-600 text-white rounded-2xl hover:bg-red-700 font-semibold flex items-center gap-2 shadow-sm transition-all hover:shadow-md"
                        >
                            <Ban size={18} /> Add
                        </button>
                        <button
                            onClick={syncBounced}
                            className="px-6 py-3 bg-orange-100 text-orange-700 rounded-2xl hover:bg-orange-200 font-semibold flex items-center gap-2 transition-all border border-orange-200"
                        >
                            <AlertTriangle size={18} /> Sync Bounced
                        </button>
                    </div>
                </div>
                <p className="text-sm font-medium text-gray-400 mt-4 flex items-center gap-2">
                    <Shield size={16} /> Blacklisted emails will be automatically skipped during sequence execution.
                </p>
            </motion.div>

            {/* Blacklist Table */}
            <motion.div initial="hidden" animate="visible" custom={2} variants={fadeUp} className="bg-white dark:bg-zinc-900/60 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-zinc-800/80 dark:border-zinc-800/80 overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all flex flex-col">
                <div className="p-6 bg-slate-50 dark:bg-zinc-900/50 dark:bg-zinc-900/30/50 border-b border-slate-100 dark:border-zinc-800/80 dark:border-zinc-800/80 flex items-center justify-between">
                    <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50">Blacklisted Entities</h2>
                    <span className="text-sm font-bold tracking-wider text-slate-500 dark:text-zinc-50 uppercase bg-white dark:bg-zinc-900/60 px-3 py-1 rounded-full border border-slate-200 dark:border-zinc-800 dark:border-zinc-800">
                        {blacklist.length} Total
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-white dark:bg-zinc-900/60 border-b border-slate-100 dark:border-zinc-800/80 dark:border-zinc-800/80">
                            <tr>
                                <th className="text-left p-4 font-semibold text-slate-700 dark:text-zinc-50">Email</th>
                                <th className="text-left p-4 font-semibold text-slate-700 dark:text-zinc-50">Reason</th>
                                <th className="text-left p-4 font-semibold text-slate-700 dark:text-zinc-50">Added</th>
                                <th className="text-center p-4 font-semibold text-slate-700 dark:text-zinc-50">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {blacklist.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-12 text-gray-400">
                                        No blacklisted emails yet
                                    </td>
                                </tr>
                            ) : (
                                blacklist.map(item => (
                                    <tr key={item.id} className="border-b border-slate-100 dark:border-zinc-800/80 dark:border-zinc-800/80/50 hover:bg-slate-50 dark:bg-zinc-900/50 dark:bg-zinc-900/30/50 transition-colors">
                                        <td className="p-4 font-semibold text-slate-800 dark:text-zinc-50">{item.email}</td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${item.reason === 'bounced' ? 'bg-red-100 text-red-700 border border-red-200' :
                                                item.reason === 'unsubscribed' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                                                    'bg-slate-100 dark:bg-zinc-800/50 dark:bg-zinc-800/50 text-slate-700 dark:text-zinc-50 border border-slate-200 dark:border-zinc-800 dark:border-zinc-800'
                                                }`}>
                                                {item.reason}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm font-medium text-slate-500 dark:text-zinc-50">
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => removeFromBlacklist(item.id)}
                                                className="text-gray-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100 transition-all inline-block"
                                                title="Remove from Blacklist"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
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
