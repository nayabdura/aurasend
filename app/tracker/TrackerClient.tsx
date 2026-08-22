'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Eye, Mail, RefreshCw, Zap, TrendingUp, MessageSquare,
    Clock, Circle, Bell, BellOff, ChevronRight, BarChart3,
    Activity, Send, User, Search, Filter
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface OpenEvent {
    lead_id: number;
    lead_email: string;
    lead_name: string;
    company: string;
    opened_at: number;
    sent_at: number;
    campaign_id: number | null;
    campaign_name: string | null;
    replied: number;
    status: string;
    sender_email: string | null;
    sender_name: string | null;
    gmail_id: number | null;
}

interface AccountStat {
    id: number;
    email: string;
    name: string | null;
    opens: number;
    replies: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(ms: number | null | undefined): string {
    if (!ms) return '—';
    const tMs = ms > 1e12 ? ms : ms * 1000;
    const diff = Date.now() - tMs;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

function fmtDate(ms: number | null | undefined): string {
    if (!ms) return '—';
    const tMs = ms > 1e12 ? ms : ms * 1000;
    return new Date(tMs).toLocaleString('en-PK', {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
    });
}

function isRecent(ms: number | null | undefined, mins: number = 30): boolean {
    if (!ms) return false;
    const tMs = ms > 1e12 ? ms : ms * 1000;
    return (Date.now() - tMs) < mins * 60000;
}

// ─── Live Pulse Dot ───────────────────────────────────────────────────────────

function PulseDot({ active }: { active: boolean }) {
    return (
        <span className="relative flex h-2.5 w-2.5">
            {active && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${active ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
        </span>
    );
}

// ─── Notification Toast ───────────────────────────────────────────────────────

interface Notif {
    id: number;
    email: string;
    name: string;
    account: string;
    at: number;
}

function NotifToast({ notif, onDismiss }: { notif: Notif; onDismiss: () => void }) {
    useEffect(() => {
        const t = setTimeout(onDismiss, 6000);
        return () => clearTimeout(t);
    }, [onDismiss]);

    return (
        <motion.div
            initial={{ opacity: 0, x: 80, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.9 }}
            className="flex items-start gap-3 bg-white dark:bg-zinc-900/60 border border-emerald-200 shadow-xl rounded-2xl p-4 w-80 cursor-pointer"
            onClick={onDismiss}
        >
            <div className="p-2 bg-emerald-50 rounded-xl shrink-0">
                <Eye size={18} className="text-emerald-600" />
            </div>
            <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-zinc-50">Email Opened! 👀</p>
                <p className="text-sm text-emerald-700 font-semibold truncate">{notif.name || notif.email}</p>
                <p className="text-xs text-slate-400 truncate">{notif.email}</p>
                <p className="text-xs text-slate-400 mt-0.5">via {notif.account || 'unknown'} · just now</p>
            </div>
        </motion.div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TrackerClient() {
    const [data, setData] = useState<{ opens: OpenEvent[]; accountStats: AccountStat[]; totals: any } | null>(null);
    const [loading, setLoading] = useState(true);
    const [polling, setPolling] = useState(true);
    const [lastPoll, setLastPoll] = useState<Date | null>(null);
    const [newCount, setNewCount] = useState(0);
    const [notifications, setNotifications] = useState<Notif[]>([]);
    const [search, setSearch] = useState('');
    const [filterAccount, setFilterAccount] = useState('all');
    const [filterRecency, setFilterRecency] = useState('all');
    const knownIds = useRef<Set<number>>(new Set());
    const notifId = useRef(0);
    const pollingRef = useRef(polling);
    pollingRef.current = polling;

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch('/api/track/opens');
            if (!res.ok) return;
            const json = await res.json();

            // Find new opens we haven't seen before
            if (knownIds.current.size > 0) {
                const fresh: OpenEvent[] = json.opens.filter((o: OpenEvent) => !knownIds.current.has(o.lead_id));
                if (fresh.length > 0) {
                    setNewCount(c => c + fresh.length);
                    // Fire browser notification if supported
                    fresh.forEach(o => {
                        const nid = ++notifId.current;
                        setNotifications(prev => [...prev, {
                            id: nid,
                            email: o.lead_email,
                            name: o.lead_name,
                            account: o.sender_email || '',
                            at: Date.now()
                        }]);
                    });
                }
            }

            // Update known IDs
            json.opens.forEach((o: OpenEvent) => knownIds.current.add(o.lead_id));

            setData(json);
            setLastPoll(new Date());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Polling every 15s
    useEffect(() => {
        if (!polling) return;
        const interval = setInterval(() => {
            if (pollingRef.current) fetchData();
        }, 15000);
        return () => clearInterval(interval);
    }, [polling, fetchData]);

    const dismissNotif = useCallback((id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                        <Eye size={32} className="text-indigo-500 animate-pulse" />
                    </div>
                    <p className="text-slate-600 dark:text-zinc-400 font-medium">Loading tracker data...</p>
                </div>
            </div>
        );
    }

    const opens = data?.opens || [];
    const accountStats = data?.accountStats || [];
    const totals = data?.totals || {};

    // Filter
    let filtered = opens;
    if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(o =>
            o.lead_email.toLowerCase().includes(q) ||
            (o.lead_name || '').toLowerCase().includes(q) ||
            (o.company || '').toLowerCase().includes(q) ||
            (o.campaign_name || '').toLowerCase().includes(q)
        );
    }
    if (filterAccount !== 'all') {
        filtered = filtered.filter(o => o.sender_email === filterAccount);
    }
    if (filterRecency === 'hour') {
        filtered = filtered.filter(o => isRecent(o.opened_at, 60));
    } else if (filterRecency === 'today') {
        filtered = filtered.filter(o => isRecent(o.opened_at, 1440));
    }

    const openRate = totals.total_sent > 0 ? Math.round((totals.total_opened / totals.total_sent) * 100) : 0;
    const replyRate = totals.total_opened > 0 ? Math.round((totals.total_replied / totals.total_opened) * 100) : 0;

    return (
        <>
            {/* Fixed notification toasts */}
            <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3">
                <AnimatePresence>
                    {notifications.map(n => (
                        <NotifToast key={n.id} notif={n} onDismiss={() => dismissNotif(n.id)} />
                    ))}
                </AnimatePresence>
            </div>

            <div className="space-y-6">
                {/* Header */}
                <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm">
                    <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200">
                                    <Eye size={24} />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-black text-slate-900 dark:text-zinc-50 tracking-tight">Email Tracker</h1>
                                    <p className="text-slate-500 dark:text-zinc-400 text-sm">Real-time pixel tracking across all outbound accounts</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {newCount > 0 && (
                                <motion.div
                                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-2xl font-bold text-sm"
                                >
                                    <Bell size={16} className="animate-bounce" />
                                    {newCount} new open{newCount > 1 ? 's' : ''} since load
                                </motion.div>
                            )}
                            <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl text-sm">
                                <PulseDot active={polling} />
                                <span className="font-medium text-slate-600 dark:text-zinc-400">
                                    {polling ? 'Live · 15s' : 'Paused'}
                                </span>
                                {lastPoll && (
                                    <span className="text-slate-400 text-xs hidden sm:block">
                                        Updated {timeAgo(lastPoll.getTime())}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => setPolling(p => !p)}
                                className={`p-2.5 rounded-xl border transition-colors ${polling ? 'border-amber-200 text-amber-600 hover:bg-amber-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}
                                title={polling ? 'Pause live refresh' : 'Resume live refresh'}
                            >
                                {polling ? <BellOff size={18} /> : <Bell size={18} />}
                            </button>
                            <button
                                onClick={() => { setNewCount(0); fetchData(); }}
                                className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:bg-zinc-800/50 transition-colors"
                                title="Refresh now"
                            >
                                <RefreshCw size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Summary metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                        {[
                            { icon: <Send size={16} />, label: 'Total Sent', value: totals.total_sent || 0, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                            { icon: <Eye size={16} />, label: 'Total Opened', value: totals.total_opened || 0, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                            { icon: <TrendingUp size={16} />, label: 'Open Rate', value: `${openRate}%`, color: 'text-amber-600', bg: 'bg-amber-50' },
                            { icon: <MessageSquare size={16} />, label: 'Reply Rate', value: `${replyRate}%`, color: 'text-purple-600', bg: 'bg-purple-50' },
                        ].map(s => (
                            <div key={s.label} className={`${s.bg} rounded-2xl p-4`}>
                                <div className={`flex items-center gap-2 ${s.color} mb-2`}>
                                    {s.icon}
                                    <span className="text-xs font-bold uppercase tracking-wider">{s.label}</span>
                                </div>
                                <p className="text-3xl font-black text-slate-900 dark:text-zinc-50">{s.value}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                    {/* Per-Account stats panel */}
                    <div className="xl:col-span-1">
                        <div className="bg-white dark:bg-zinc-900/60 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                            <div className="px-6 py-5 border-b border-slate-100 dark:border-zinc-800/80 flex items-center gap-2">
                                <BarChart3 size={16} className="text-indigo-500" />
                                <h2 className="font-bold text-slate-900 dark:text-zinc-50 text-sm">Per-Account Stats</h2>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {accountStats.length === 0 ? (
                                    <div className="p-6 text-center text-slate-400 text-sm">No accounts found</div>
                                ) : accountStats.map(acc => (
                                    <div key={acc.id} className={`p-4 cursor-pointer hover:bg-slate-50 dark:bg-zinc-900/50 transition-colors ${filterAccount === acc.email ? 'bg-indigo-50' : ''}`}
                                        onClick={() => setFilterAccount(filterAccount === acc.email ? 'all' : acc.email)}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="min-w-0">
                                                <p className="font-semibold text-slate-900 dark:text-zinc-50 text-xs truncate">{acc.email}</p>
                                                {acc.name && <p className="text-[10px] text-slate-400">{acc.name}</p>}
                                            </div>
                                            {filterAccount === acc.email && (
                                                <span className="text-[10px] text-indigo-600 font-bold ml-1">FILTER</span>
                                            )}
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="flex items-center gap-1 text-xs text-emerald-600 font-bold">
                                                <Eye size={11} /> {acc.opens}
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-purple-600 font-bold">
                                                <MessageSquare size={11} /> {acc.replies}
                                            </div>
                                        </div>
                                        {acc.opens > 0 && (
                                            <div className="mt-2 h-1.5 bg-slate-100 dark:bg-zinc-800/50 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-emerald-400 rounded-full"
                                                    style={{ width: `${Math.min((acc.opens / Math.max(totals.total_opened, 1)) * 100, 100)}%` }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {filterAccount !== 'all' && (
                                    <button onClick={() => setFilterAccount('all')} className="w-full py-3 text-xs text-slate-400 hover:text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:bg-zinc-900/50 transition-colors font-semibold">
                                        Clear filter ✕
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Main open events table */}
                    <div className="xl:col-span-3">
                        <div className="bg-white dark:bg-zinc-900/60 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                            {/* Filters */}
                            <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800/80 flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 flex-1 min-w-48">
                                    <Search size={14} className="text-slate-400 shrink-0" />
                                    <input
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        placeholder="Search by name, email, company..."
                                        className="bg-transparent text-sm text-slate-800 dark:text-zinc-200 outline-none flex-1 placeholder:text-slate-400"
                                    />
                                </div>
                                <div className="flex items-center gap-1 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl p-1">
                                    {[['all', 'All Time'], ['hour', 'Last Hour'], ['today', 'Today']].map(([v, l]) => (
                                        <button
                                            key={v}
                                            onClick={() => setFilterRecency(v)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filterRecency === v ? 'bg-white dark:bg-zinc-900/60 text-indigo-600 shadow-sm' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:text-zinc-300'}`}
                                        >
                                            {l}
                                        </button>
                                    ))}
                                </div>
                                <span className="text-xs text-slate-400 font-medium ml-auto">{filtered.length} opens</span>
                            </div>

                            {/* Table */}
                            {filtered.length === 0 ? (
                                <div className="text-center py-24">
                                    <Eye size={48} className="text-slate-200 mx-auto mb-4" />
                                    <h3 className="text-lg font-bold text-slate-700 dark:text-zinc-300 mb-2">No opens tracked yet</h3>
                                    <p className="text-slate-400 text-sm max-w-sm mx-auto">
                                        Every time a recipient opens your email, it will appear here instantly.
                                        Tracking pixels are automatically embedded in all outbound emails.
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-50">
                                    {filtered.map((o, idx) => {
                                        const isNew = isRecent(o.opened_at, 30);
                                        const tMs = o.opened_at > 1e12 ? o.opened_at : o.opened_at * 1000;

                                        return (
                                            <motion.div
                                                key={o.lead_id}
                                                initial={idx < 5 ? { opacity: 0, y: 5 } : false}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx < 5 ? idx * 0.04 : 0 }}
                                                className={`flex items-center gap-4 px-6 py-4 hover:bg-slate-50 dark:bg-zinc-900/50 transition-colors ${isNew ? 'border-l-4 border-emerald-400' : ''}`}
                                            >
                                                {/* Avatar */}
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${isNew ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 dark:bg-zinc-800/50 text-slate-500 dark:text-zinc-400'}`}>
                                                    {(o.lead_name || o.lead_email).charAt(0).toUpperCase()}
                                                </div>

                                                {/* Lead info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className="font-semibold text-slate-900 dark:text-zinc-50 text-sm truncate">
                                                            {o.lead_name || o.lead_email}
                                                        </span>
                                                        {isNew && (
                                                            <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                                                <Circle size={6} fill="currentColor" /> New
                                                            </span>
                                                        )}
                                                        {o.replied === 1 && (
                                                            <span className="text-[10px] font-bold text-purple-600 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                                                Replied
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-slate-400">
                                                        <span className="truncate">{o.lead_email}</span>
                                                        {o.company && <>
                                                            <span className="text-slate-200">·</span>
                                                            <span className="truncate text-slate-500 dark:text-zinc-400">{o.company}</span>
                                                        </>}
                                                    </div>
                                                </div>

                                                {/* Sender account */}
                                                <div className="shrink-0 text-right hidden md:block">
                                                    <div className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg">
                                                        {o.sender_email || 'Unknown account'}
                                                    </div>
                                                    {o.campaign_name && (
                                                        <div className="text-[10px] text-slate-400 mt-1 truncate max-w-32">{o.campaign_name}</div>
                                                    )}
                                                </div>

                                                {/* Time */}
                                                <div className="shrink-0 text-right min-w-[80px]">
                                                    <div className={`text-sm font-bold ${isNew ? 'text-emerald-600' : 'text-slate-600 dark:text-zinc-400'}`}>
                                                        {timeAgo(o.opened_at)}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400">
                                                        {fmtDate(o.opened_at)}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
