'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare, Mail, RefreshCw, Eye, CheckCircle2,
    AlertTriangle, Search, Filter, Inbox, Reply, Clock, Trash, Trash2
} from 'lucide-react';

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.35 } })
};

export default function ConversationsClient() {
    const [threads, setThreads] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [polling, setPolling] = useState(false);
    const [selected, setSelected] = useState<any>(null);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const [selectedIds, setSelectedIds] = useState<any[]>([]);

    useEffect(() => { loadData(); }, [filter]);

    async function loadData() {
        setLoading(true);
        try {
            const res = await fetch(`/api/conversations?unread=${filter === 'unread'}`);
            const data = await res.json();
            setThreads(data.threads || []);
            setUnreadCount(data.unreadCount || 0);
        } finally {
            setLoading(false);
        }
    }

    async function pollInbox() {
        setPolling(true);
        try {
            const res = await fetch('/api/inbox/poll', { method: 'POST' });
            const data = await res.json();
            if (data.totalReplies > 0 || data.totalBounces > 0) {
                await loadData();
            }
            alert(`✅ Inbox polled: ${data.totalReplies} replies, ${data.totalBounces} bounces found`);
        } catch (e) {
            alert('❌ Failed to poll inbox. Check IMAP settings.');
        } finally {
            setPolling(false);
        }
    }

    async function markRead(thread: any) {
        if (thread.is_read) {
            setSelected(thread);
            return;
        }
        setSelected(thread);
        await fetch(`/api/conversations/${thread.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_read: true })
        });
        setThreads(prev => prev.map(t => t.id === thread.id ? { ...t, is_read: 1 } : t));
        setUnreadCount(prev => Math.max(0, prev - 1));
    }

    async function handleDeleteSingle(id: any) {
        if (!confirm('Are you sure you want to delete this conversation from history? This cannot be undone.')) return;
        try {
            const res = await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                setSelected(null);
                setSelectedIds(prev => prev.filter(x => x !== id));
                await loadData();
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (err: any) {
            alert(`Failed to delete: ${err.message}`);
        }
    }

    async function handleBulkDelete() {
        if (selectedIds.length === 0) return;
        if (!confirm(`Are you sure you want to delete the ${selectedIds.length} selected conversations? This cannot be undone.`)) return;

        try {
            const res = await fetch('/api/conversations/bulk-delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedIds })
            });
            const data = await res.json();
            if (data.success) {
                alert(`Successfully deleted ${data.count} conversations.`);
                setSelectedIds([]);
                setSelected(null);
                await loadData();
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (err: any) {
            alert(`Failed to delete: ${err.message}`);
        }
    }

    const filtered = threads.filter(t =>
        t.lead_email?.toLowerCase().includes(search.toLowerCase()) ||
        t.subject?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp}
                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                            <Inbox size={24} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-zinc-50">Conversations</h1>
                            <p className="text-slate-500 dark:text-zinc-50 text-sm">
                                Reply inbox •
                                {unreadCount > 0 && (
                                    <span className="ml-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                        {unreadCount} unread
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <motion.button
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={pollInbox} disabled={polling}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
                    >
                        <RefreshCw size={18} className={polling ? 'animate-spin' : ''} />
                        {polling ? 'Polling...' : 'Check Inbox (IMAP)'}
                    </motion.button>
                </div>
            </motion.div>

            {/* Search + Filter */}
            <motion.div initial="hidden" animate="visible" custom={1} variants={fadeUp}
                className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-zinc-800 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-zinc-900/60 shadow-sm"
                        placeholder="Search by email or subject..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    {(['all', 'unread'] as const).map(f => (
                        <button key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2.5 rounded-xl font-semibold transition-all border ${filter === f ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white dark:bg-zinc-900/60 text-slate-600 dark:text-zinc-50 border-slate-200 dark:border-zinc-800 dark:border-zinc-800 hover:bg-slate-50 dark:bg-zinc-900/50 dark:bg-zinc-900/30'}`}
                        >
                            {f === 'all' ? 'All' : `Unread (${unreadCount})`}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Main Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Thread List */}
                <motion.div initial="hidden" animate="visible" custom={2} variants={fadeUp}
                    className="lg:col-span-2 bg-white dark:bg-zinc-900/60 rounded-2xl shadow-lg border border-slate-100 dark:border-zinc-800/80 dark:border-zinc-800/80 overflow-hidden flex flex-col">
                    {filtered.length > 0 && (
                        <div className="bg-slate-50 dark:bg-zinc-900/50 px-4 py-3 border-b border-slate-150 dark:border-zinc-800 flex items-center justify-between gap-3 text-xs font-semibold text-slate-700 dark:text-zinc-300">
                            <label className="flex items-center gap-2.5 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={filtered.length > 0 && selectedIds.length === filtered.length}
                                    onChange={() => {
                                        if (selectedIds.length === filtered.length) {
                                            setSelectedIds([]);
                                        } else {
                                            setSelectedIds(filtered.map(t => t.id));
                                        }
                                    }}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4.5 h-4.5 cursor-pointer"
                                />
                                Select All ({filtered.length})
                            </label>
                            {selectedIds.length > 0 && (
                                <button
                                    onClick={handleBulkDelete}
                                    className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors flex items-center gap-1 shadow-sm"
                                >
                                    <Trash size={13} /> Delete Selected ({selectedIds.length})
                                </button>
                            )}
                        </div>
                    )}
                    <div className="flex-1 overflow-y-auto max-h-[650px] divide-y divide-gray-100 dark:divide-zinc-800">
                        {loading ? (
                            <div className="flex items-center justify-center py-16">
                                <RefreshCw size={24} className="animate-spin text-blue-500" />
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="text-center py-16">
                                <MessageSquare size={48} className="text-gray-200 mx-auto mb-4" />
                                <p className="text-gray-400 font-medium">No conversations yet</p>
                                <p className="text-sm text-gray-400 mt-1">Click "Check Inbox" to poll for replies</p>
                            </div>
                        ) : (
                            filtered.map((thread, i) => {
                                const isChecked = selectedIds.includes(thread.id);
                                return (
                                    <motion.div
                                        key={thread.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: i * 0.05 }}
                                        className={`p-4 cursor-pointer transition-all hover:bg-blue-50 flex items-start gap-3 ${selected?.id === thread.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''} ${!thread.is_read ? 'bg-blue-50/30' : ''}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                setSelectedIds(prev =>
                                                    isChecked ? prev.filter(x => x !== thread.id) : [...prev, thread.id]
                                                );
                                            }}
                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer mt-3 shrink-0"
                                        />
                                        <div className="flex-1 flex gap-3 min-w-0" onClick={() => markRead(thread)}>
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 shrink-0 ${thread.direction === 'inbound' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {(thread.lead_email?.[0] || '?').toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <p className={`text-sm truncate font-semibold ${!thread.is_read ? 'text-slate-900 dark:text-zinc-50' : 'text-slate-700 dark:text-zinc-50'}`}>
                                                        {thread.lead_email}
                                                    </p>
                                                    {!thread.is_read && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                                                </div>
                                                <p className="text-xs text-slate-500 dark:text-zinc-50 truncate mt-0.5">{thread.subject || '(no subject)'}</p>
                                                <p className="text-xs text-gray-400 truncate mt-1">{thread.last_message?.substring(0, 80)}...</p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${thread.direction === 'inbound' ? 'bg-green-100 text-green-700' : thread.subject?.startsWith('BOUNCE') ? 'bg-red-100 text-red-700' : 'bg-slate-100 dark:bg-zinc-800/50 dark:bg-zinc-800/50 text-slate-600 dark:text-zinc-50'}`}>
                                                        {thread.subject?.startsWith('BOUNCE') ? '⚡ Bounce' : thread.direction === 'inbound' ? '↙ Reply' : '↗ Sent'}
                                                    </span>
                                                    <span className="text-xs text-gray-400">
                                                        <Clock size={10} className="inline mr-1" />
                                                        {thread.last_message_date ? new Date(thread.last_message_date).toLocaleDateString() : '—'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </div>
                </motion.div>

                {/* Message Preview */}
                <motion.div initial="hidden" animate="visible" custom={3} variants={fadeUp}
                    className="lg:col-span-3 bg-white dark:bg-zinc-900/60 rounded-2xl shadow-lg border border-slate-100 dark:border-zinc-800/80 dark:border-zinc-800/80">
                    {!selected ? (
                        <div className="flex flex-col items-center justify-center h-full py-24 text-center">
                            <MessageSquare size={56} className="text-gray-200 mb-4" />
                            <p className="text-gray-400 font-medium">Select a conversation to read</p>
                        </div>
                    ) : (
                        <div className="p-8">
                            <div className="flex items-start justify-between mb-6 gap-4">
                                <div className="min-w-0 flex-1">
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-50">{selected.subject || '(No Subject)'}</h2>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                                        <span className="text-sm text-slate-500 dark:text-zinc-50">From:</span>
                                        <span className="text-sm font-semibold text-slate-800 dark:text-zinc-50 truncate">{selected.lead_email}</span>
                                        {selected.from_account && (
                                            <>
                                                <span className="text-gray-300">→</span>
                                                <span className="text-sm text-slate-500 dark:text-zinc-50 truncate">To: {selected.from_account}</span>
                                            </>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                                        <Clock size={12} />
                                        {selected.last_message_date ? new Date(selected.last_message_date).toLocaleString() : '—'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    {selected.is_read ? (
                                        <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-full font-semibold border border-green-200">
                                            <CheckCircle2 size={14} /> Read
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full font-semibold border border-blue-200">
                                            <Mail size={14} /> Unread
                                        </span>
                                    )}
                                    <button 
                                        onClick={() => handleDeleteSingle(selected.id)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl border border-slate-200 dark:border-zinc-800 transition-colors"
                                        title="Delete Conversation"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="bg-slate-50 dark:bg-zinc-900/50 dark:bg-zinc-900/30 rounded-xl p-6 border border-slate-200 dark:border-zinc-800 dark:border-zinc-800">
                                {selected.subject?.startsWith('BOUNCE') ? (
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-semibold text-red-700 mb-1">Delivery Failure / Bounce</p>
                                            <p className="text-sm text-slate-700 dark:text-zinc-50 whitespace-pre-wrap">{selected.last_message}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-800 dark:text-zinc-50 whitespace-pre-wrap leading-relaxed">{selected.last_message}</p>
                                )}
                            </div>

                            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200 flex items-center gap-3">
                                <Reply size={18} className="text-blue-600" />
                                <p className="text-sm text-blue-800">
                                    To reply, open your Gmail account for <strong>{selected.from_account}</strong> and respond directly to {selected.lead_email}
                                </p>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
