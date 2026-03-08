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

    if (loading) return <div className="p-8 text-center text-gray-500">Loading blacklist...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp} className="bg-gradient-to-br from-red-600 to-rose-700 rounded-3xl p-10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl"></div>
                <div className="relative z-10">
                    <h1 className="text-4xl font-extrabold mb-3 flex items-center gap-4 tracking-tight">
                        <Shield size={40} className="text-red-200" /> Blacklist Manager
                    </h1>
                    <p className="text-red-100 text-lg max-w-xl">Manage blocked and bounced email addresses. Prevent accidental outreach to invalid or opted-out leads.</p>
                </div>
            </motion.div>

            {/* Add Email */}
            <motion.div initial="hidden" animate="visible" custom={1} variants={fadeUp} className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
                <h2 className="text-xl font-extrabold mb-6 flex items-center gap-2 tracking-tight text-gray-900">
                    <Plus size={24} className="text-red-500 bg-red-50 p-1 flex-shrink-0 rounded-lg" /> Add Email to Blacklist
                </h2>
                <div className="flex flex-col md:flex-row gap-4">
                    <input
                        type="email"
                        placeholder="email@example.com"
                        value={newEmail}
                        onChange={e => setNewEmail(e.target.value)}
                        className="flex-1 px-5 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-500 outline-none transition-all placeholder:text-gray-400"
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
            <motion.div initial="hidden" animate="visible" custom={2} variants={fadeUp} className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all flex flex-col">
                <div className="p-6 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-xl font-extrabold tracking-tight text-gray-900">Blacklisted Entities</h2>
                    <span className="text-sm font-bold tracking-wider text-gray-500 uppercase bg-white px-3 py-1 rounded-full border border-gray-200">
                        {blacklist.length} Total
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-white border-b border-gray-100">
                            <tr>
                                <th className="text-left p-4 font-semibold text-gray-700">Email</th>
                                <th className="text-left p-4 font-semibold text-gray-700">Reason</th>
                                <th className="text-left p-4 font-semibold text-gray-700">Added</th>
                                <th className="text-center p-4 font-semibold text-gray-700">Actions</th>
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
                                    <tr key={item.id} className="border-b border-gray-100/50 hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4 font-semibold text-gray-800">{item.email}</td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${item.reason === 'bounced' ? 'bg-red-100 text-red-700 border border-red-200' :
                                                item.reason === 'unsubscribed' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                                                    'bg-gray-100 text-gray-700 border border-gray-200'
                                                }`}>
                                                {item.reason}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm font-medium text-gray-500">
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
