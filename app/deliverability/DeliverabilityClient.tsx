'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Shield, TrendingUp, AlertTriangle, CheckCircle2, Mail,
    Zap, BarChart3, Activity, RefreshCw, Info, Star
} from 'lucide-react';

const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } })
};

function ScoreRing({ value, max = 100, label, color }: { value: number; max?: number; label: string; color: string }) {
    const pct = Math.max(0, Math.min(100, (value / max) * 100));
    const r = 38;
    const circ = 2 * Math.PI * r;
    const dash = (pct / 100) * circ;

    return (
        <div className="flex flex-col items-center">
            <svg width="96" height="96" viewBox="0 0 96 96">
                <circle cx="48" cy="48" r={r} fill="none" stroke="#27272a" strokeWidth="8" />
                <motion.circle
                    cx="48" cy="48" r={r}
                    fill="none" stroke={color} strokeWidth="8"
                    strokeDasharray={`${circ}`}
                    strokeDashoffset={circ}
                    animate={{ strokeDashoffset: circ - dash }}
                    transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                    strokeLinecap="round"
                    transform="rotate(-90 48 48)"
                />
                <text x="48" y="52" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#f4f4f5">{value}</text>
            </svg>
            <p className="text-xs text-zinc-500 mt-2 font-semibold tracking-wider uppercase">{label}</p>
        </div>
    );
}

export default function DeliverabilityClient() {
    const [data, setData] = useState<any>({ accounts: [], globalStats: {} });
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<any>(null);

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        try {
            const res = await fetch('/api/deliverability');
            const json = await res.json();
            setData(json);
            if (json.accounts?.length > 0) setSelected(json.accounts[0]);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-zinc-500">Loading deliverability telemetry...</p>
                </div>
            </div>
        );
    }

    const { accounts, globalStats } = data;

    return (
        <div className="space-y-6">
            <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp}
                className="flex justify-end items-center mb-4">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={loadData}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg font-medium transition-colors border border-zinc-700 shadow-sm text-sm">
                    <RefreshCw size={16} /> Sync Telemetry
                </motion.button>
            </motion.div>

            <motion.div initial="hidden" animate="visible" custom={1} variants={fadeUp}
                className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Accounts', value: globalStats.totalAccounts || 0, icon: <Mail size={20} />, color: 'from-blue-400 to-indigo-500', light: 'bg-indigo-500/10 border-indigo-500/20' },
                    { label: 'Active Status', value: globalStats.activeAccounts || 0, icon: <Activity size={20} />, color: 'from-emerald-400 to-emerald-600', light: 'bg-emerald-500/10 border-emerald-500/20' },
                    { label: 'Warmed Up', value: globalStats.warmedAccounts || 0, icon: <Zap size={20} />, color: 'from-amber-400 to-orange-500', light: 'bg-amber-500/10 border-amber-500/20' },
                    { label: 'Sys Health', value: `${globalStats.avgHealthScore || 0}%`, icon: <TrendingUp size={20} />, color: 'from-purple-400 to-violet-500', light: 'bg-purple-500/10 border-purple-500/20' },
                ].map((stat, i) => (
                    <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
                        className="bg-zinc-950 rounded-2xl p-5 shadow-sm border border-zinc-800 transition-all">
                        <div className={`w-10 h-10 rounded-lg border ${stat.light} flex items-center justify-center mb-3`}>
                            <span className={`bg-gradient-to-br ${stat.color} [-webkit-background-clip:text] [background-clip:text] text-transparent`}>
                                {stat.icon}
                            </span>
                        </div>
                        <p className="text-3xl font-black text-zinc-100 mt-1">{stat.value}</p>
                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mt-1">{stat.label}</p>
                    </motion.div>
                ))}
            </motion.div>

            {accounts.length === 0 ? (
                <motion.div initial="hidden" animate="visible" custom={2} variants={fadeUp}
                    className="bg-zinc-950 rounded-2xl shadow-sm border border-zinc-800 p-16 text-center">
                    <Mail size={56} className="text-zinc-800 mx-auto mb-4" />
                    <p className="text-zinc-500 font-medium">No accounts active in deliverability system</p>
                    <a href="/gmail" className="mt-4 inline-block px-6 py-2 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 rounded-lg font-semibold hover:bg-indigo-600/20 transition-colors">
                        Register Account
                    </a>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <motion.div initial="hidden" animate="visible" custom={2} variants={fadeUp}
                        className="lg:col-span-2 bg-zinc-950 rounded-2xl shadow-sm border border-zinc-800 overflow-hidden flex flex-col max-h-[600px]">
                        <div className="p-5 border-b border-zinc-800 bg-zinc-900/50">
                            <h2 className="text-md font-bold text-zinc-200">System Nodes</h2>
                        </div>
                        <div className="divide-y divide-zinc-800/50 overflow-y-auto">
                            {accounts.map((acc: any, i: number) => {
                                const isSelected = selected?.id === acc.id;
                                const healthColor = acc.warmup_health_score >= 80 ? 'text-emerald-400 bg-emerald-500/10' :
                                    acc.warmup_health_score >= 60 ? 'text-amber-400 bg-amber-500/10' :
                                        acc.warmup_health_score >= 40 ? 'text-orange-400 bg-orange-500/10' :
                                            'text-rose-400 bg-rose-500/10';
                                return (
                                    <motion.div key={acc.id} custom={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }}
                                        onClick={() => setSelected(acc)}
                                        className={`p-4 cursor-pointer transition-all ${isSelected ? 'bg-zinc-900 border-l-2 border-indigo-500' : 'hover:bg-zinc-900 border-l-2 border-transparent'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                                {acc.email?.[0]?.toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-zinc-200 truncate">{acc.email}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md font-bold ${healthColor}`}>
                                                        {acc.healthLabel || 'Active'}
                                                    </span>
                                                    {acc.warmup_enabled ? <Zap size={12} className="text-amber-500" /> : null}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-black text-zinc-100">{acc.warmup_health_score || 0}</p>
                                                <p className="text-[10px] uppercase font-bold text-zinc-600">Health</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>

                    <motion.div initial="hidden" animate="visible" custom={3} variants={fadeUp}
                        className="lg:col-span-3 bg-zinc-950 rounded-2xl shadow-sm border border-zinc-800 p-8 flex flex-col">
                        {!selected ? (
                            <div className="flex items-center justify-center flex-1 h-full min-h-[400px]">
                                <p className="text-zinc-600">Select an account telemetry node</p>
                            </div>
                        ) : (
                            <div className="flex-1">
                                <div className="flex items-center gap-5 mb-8 border-b border-zinc-800 pb-6">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-black shadow-lg">
                                        {selected.email?.[0]?.toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-xl font-bold text-zinc-50">{selected.email}</h2>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className={`text-[11px] px-2.5 py-1 rounded-md uppercase font-bold tracking-wider border ${selected.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                                                {selected.status}
                                            </span>
                                            {selected.warmup_enabled ? (
                                                <span className="text-[11px] px-2.5 py-1 rounded-md uppercase font-bold tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1.5">
                                                    <Zap size={12} /> Warmup <span className="opacity-50">|</span> Day {selected.warmup_day}
                                                </span>
                                            ) : (
                                                <span className="text-[11px] px-2.5 py-1 rounded-md uppercase font-bold tracking-wider bg-zinc-800 text-zinc-500 border border-zinc-700">Warmup Off</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-6 mb-8 p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
                                    <ScoreRing value={selected.warmup_health_score || 0} label="Warmup Health" color="#34d399" />
                                    <ScoreRing value={100 - (selected.spamRisk || 0)} label="Reputation" color="#6366f1" />
                                    <ScoreRing value={selected.engagement_score || 0} label="Engagement" color="#a855f7" />
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                    {[
                                        { label: 'Network Output', value: `${selected.sent_today || 0}/${selected.daily_limit || 0}`, icon: '📤', bg: 'bg-zinc-900 border-zinc-800', text: 'text-zinc-200' },
                                        { label: 'Open Rate', value: `${selected.openRate || '0.0'}%`, icon: '👁️', bg: 'bg-zinc-900 border-zinc-800', text: 'text-zinc-200' },
                                        { label: 'Reply Metric', value: `${selected.replyRate || '0.0'}%`, icon: '↩️', bg: 'bg-zinc-900 border-zinc-800', text: 'text-zinc-200' },
                                        { label: 'Bounce Rate', value: `${selected.bounceRate || '0.0'}%`, icon: '⚡', bg: selected.bounceRate > 5 ? 'bg-rose-500/10 border-rose-500/20' : 'bg-zinc-900 border-zinc-800', text: selected.bounceRate > 5 ? 'text-rose-400' : 'text-zinc-200' },
                                    ].map((s, i) => (
                                        <div key={i} className={`${s.bg} border rounded-xl p-4 text-center transition-colors`}>
                                            <p className="text-xl mb-2 opacity-80">{s.icon}</p>
                                            <p className={`text-lg font-black ${s.text}`}>{s.value}</p>
                                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-1">{s.label}</p>
                                        </div>
                                    ))}
                                </div>

                                {(selected.spamRisk || 0) > 50 && (
                                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                        className="p-5 bg-rose-500/10 rounded-xl border border-rose-500/20 flex items-start gap-4">
                                        <AlertTriangle size={24} className="text-rose-500 flex-shrink-0" />
                                        <div>
                                            <p className="font-bold text-rose-400">High Spam Risk Detected ({selected.spamRisk}%)</p>
                                            <p className="text-sm text-rose-500/80 mt-1">Throttle dispatch volume and expand warmup cycles to normalize IP/Domain reputation.</p>
                                        </div>
                                    </motion.div>
                                )}

                                {(selected.spamRisk || 0) <= 30 && selected.warmup_health_score >= 70 && (
                                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                        className="p-5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-start gap-4">
                                        <CheckCircle2 size={24} className="text-emerald-500 flex-shrink-0" />
                                        <div>
                                            <p className="font-bold text-emerald-400">Strong Telemetry Check</p>
                                            <p className="text-sm text-emerald-500/80 mt-1">Delivery infrastructure is stable. Ready for vertical scaling on this node.</p>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </div>
    );
}
