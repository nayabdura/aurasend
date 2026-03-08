'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bot, Play, Pause, RefreshCw, AlertTriangle, CheckCircle2,
    TrendingUp, Shield, Zap, Settings2, ChevronRight, Activity,
    BarChart3, Mail, Target, Clock, AlertCircle
} from 'lucide-react';

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.4 } })
};

const pulse = {
    scale: [1, 1.05, 1],
    transition: { repeat: Infinity, duration: 2 }
};

export default function AutopilotClient() {
    const [config, setConfig] = useState<any>({
        enabled: 0,
        auto_warmup: 1,
        auto_campaigns: 0,
        auto_follow_ups: 1,
        auto_inbox_monitor: 1,
        risk_threshold: 70,
        daily_send_limit: 50,
        send_window_start: '09:00',
        send_window_end: '17:00',
        timezone: 'America/New_York'
    });
    const [recentActions, setRecentActions] = useState<any[]>([]);
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);
    const [saving, setSaving] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        loadData();
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, []);

    useEffect(() => {
        if (config.enabled && !intervalRef.current) {
            // Auto-refresh every 30s when enabled
            intervalRef.current = setInterval(loadData, 30000);
        } else if (!config.enabled && intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, [config.enabled]);

    async function loadData() {
        try {
            const res = await fetch('/api/autopilot');
            const data = await res.json();
            if (data.config) setConfig(data.config);
            if (data.recentActions) setRecentActions(data.recentActions);
        } catch (e) {
            console.error('Failed to load autopilot data');
        } finally {
            setLoading(false);
        }
    }

    async function toggleAutopilot() {
        const newEnabled = !config.enabled;
        const updated = { ...config, enabled: newEnabled ? 1 : 0 };
        setConfig(updated);
        await saveConfig(updated);
    }

    async function saveConfig(cfg = config) {
        setSaving(true);
        try {
            await fetch('/api/autopilot', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cfg)
            });
        } finally {
            setSaving(false);
        }
    }

    async function runNow() {
        setRunning(true);
        try {
            const res = await fetch('/api/autopilot', { method: 'POST' });
            const data = await res.json();
            if (data.report) setReport(data.report);
            await loadData();
        } finally {
            setRunning(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <motion.div animate={pulse} className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
                        <Bot size={32} className="text-white" />
                    </motion.div>
                    <p className="text-gray-500">Loading AI Autopilot...</p>
                </div>
            </div>
        );
    }

    const riskScore = report?.riskScore ?? 0;
    const riskColor = riskScore > 70 ? 'text-red-500' : riskScore > 40 ? 'text-amber-500' : 'text-green-500';
    const riskBg = riskScore > 70 ? 'from-red-500 to-red-600' : riskScore > 40 ? 'from-amber-500 to-orange-500' : 'from-green-500 to-emerald-600';

    return (
        <div className="space-y-8">
            {/* Header */}
            <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp}
                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <motion.div animate={config.enabled ? pulse : {}}
                            className={`w-12 h-12 rounded-xl flex items-center justify-center ${config.enabled ? 'bg-gradient-to-br from-violet-500 to-purple-700' : 'bg-gray-200'}`}>
                            <Bot size={24} className={config.enabled ? 'text-white' : 'text-gray-400'} />
                        </motion.div>
                        <div>
                            <h1 className="text-3xl font-extrabold text-gray-900">AI Autopilot</h1>
                            <p className="text-gray-500 text-sm">100% local rule-based automation engine</p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={runNow}
                        disabled={running}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all border border-gray-200 disabled:opacity-50"
                    >
                        <RefreshCw size={18} className={running ? 'animate-spin' : ''} />
                        {running ? 'Running...' : 'Run Now'}
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={toggleAutopilot}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg ${config.enabled
                            ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-red-200'
                            : 'bg-gradient-to-r from-violet-600 to-purple-700 text-white shadow-purple-200'}`}
                    >
                        {config.enabled ? <><Pause size={18} /> Stop Autopilot</> : <><Play size={18} /> Run on Autopilot</>}
                    </motion.button>
                </div>
            </motion.div>

            {/* Status Banner */}
            <AnimatePresence>
                {config.enabled && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-gradient-to-r from-violet-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl shadow-purple-200"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <motion.div animate={pulse} className="w-4 h-4 rounded-full bg-green-400 shadow-lg shadow-green-400" />
                                <div>
                                    <p className="font-bold text-lg">🤖 AI Autopilot is ACTIVE</p>
                                    <p className="text-purple-200 text-sm">Monitoring your campaigns, warmup, and inbox automatically</p>
                                </div>
                            </div>
                            <Activity size={32} className="text-purple-200" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Risk Score + Quick Stats */}
            {report && (
                <motion.div initial="hidden" animate="visible" custom={1} variants={fadeUp}
                    className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className={`col-span-1 bg-gradient-to-br ${riskBg} rounded-2xl p-6 text-white shadow-lg`}>
                        <div className="flex items-center justify-between mb-3">
                            <Shield size={28} />
                            <span className="text-4xl font-black">{riskScore}</span>
                        </div>
                        <p className="font-bold text-lg">Risk Score</p>
                        <p className="text-sm opacity-80">{riskScore > 70 ? 'HIGH RISK — pause campaigns' : riskScore > 40 ? 'MODERATE — monitor closely' : 'LOW RISK — all systems green'}</p>
                    </div>
                    {[
                        { label: 'Actions Taken', value: report.actions?.length || 0, icon: <Zap size={24} />, color: 'bg-blue-50 text-blue-600' },
                        { label: 'Recommendations', value: report.recommendations?.length || 0, icon: <Target size={24} />, color: 'bg-amber-50 text-amber-600' },
                        { label: 'Next Run', value: report.nextRunAt ? new Date(report.nextRunAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--', icon: <Clock size={24} />, color: 'bg-green-50 text-green-600' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-md">
                            <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
                                {stat.icon}
                            </div>
                            <p className="text-3xl font-black text-gray-900">{stat.value}</p>
                            <p className="text-sm text-gray-500">{stat.label}</p>
                        </div>
                    ))}
                </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Config Panel */}
                <motion.div initial="hidden" animate="visible" custom={2} variants={fadeUp}
                    className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Settings2 size={20} className="text-violet-600" /> Autopilot Configuration
                    </h2>

                    <div className="space-y-5">
                        {[
                            { key: 'auto_warmup', label: '🔥 Auto-Enable Warmup', desc: 'Automatically start warmup for new accounts' },
                            { key: 'auto_campaigns', label: '📣 Auto-Manage Campaigns', desc: 'Pause/resume campaigns based on risk score' },
                            { key: 'auto_follow_ups', label: '📬 Smart Follow-Ups', desc: 'Automatically schedule follow-up emails' },
                            { key: 'auto_inbox_monitor', label: '📥 Inbox Monitoring', desc: 'Detect replies and bounces via IMAP' },
                        ].map(item => (
                            <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <div>
                                    <p className="font-semibold text-gray-800">{item.label}</p>
                                    <p className="text-xs text-gray-500">{item.desc}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        const updated = { ...config, [item.key]: config[item.key] ? 0 : 1 };
                                        setConfig(updated);
                                        saveConfig(updated);
                                    }}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${(config as any)[item.key] ? 'bg-violet-600' : 'bg-gray-200'}`}
                                >
                                    <motion.span
                                        animate={{ x: (config as any)[item.key] ? 20 : 2 }}
                                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                        className="inline-block h-4 w-4 rounded-full bg-white shadow-md"
                                    />
                                </button>
                            </div>
                        ))}

                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Risk Threshold (%)</label>
                                <input
                                    type="number" min={10} max={100}
                                    value={config.risk_threshold}
                                    onChange={e => setConfig({ ...config, risk_threshold: parseInt(e.target.value) })}
                                    onBlur={() => saveConfig()}
                                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                                />
                                <p className="text-xs text-gray-400 mt-1">Pause campaigns above this</p>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Max Daily Sends</label>
                                <input
                                    type="number" min={1} max={500}
                                    value={config.daily_send_limit}
                                    onChange={e => setConfig({ ...config, daily_send_limit: parseInt(e.target.value) })}
                                    onBlur={() => saveConfig()}
                                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Send Window Start</label>
                                <input
                                    type="time"
                                    value={config.send_window_start}
                                    onChange={e => setConfig({ ...config, send_window_start: e.target.value })}
                                    onBlur={() => saveConfig()}
                                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Send Window End</label>
                                <input
                                    type="time"
                                    value={config.send_window_end}
                                    onChange={e => setConfig({ ...config, send_window_end: e.target.value })}
                                    onBlur={() => saveConfig()}
                                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Recommendations */}
                <motion.div initial="hidden" animate="visible" custom={3} variants={fadeUp}
                    className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <TrendingUp size={20} className="text-amber-500" /> AI Recommendations
                    </h2>

                    {!report ? (
                        <div className="text-center py-12">
                            <Bot size={48} className="text-gray-200 mx-auto mb-4" />
                            <p className="text-gray-400">Click "Run Now" to get AI recommendations</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {report.recommendations && report.recommendations.length === 0 ? (
                                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                                    <CheckCircle2 size={20} className="text-green-600" />
                                    <span className="text-green-800 font-medium">All systems optimal! No actions needed.</span>
                                </div>
                            ) : (
                                report.recommendations?.map((rec: string, i: number) => (
                                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                                        className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
                                        <AlertCircle size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
                                        <span className="text-sm text-amber-900">{rec}</span>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Recent Actions Log */}
            <motion.div initial="hidden" animate="visible" custom={4} variants={fadeUp}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Activity size={20} className="text-blue-600" /> Recent Autopilot Actions
                </h2>

                {recentActions.length === 0 ? (
                    <div className="text-center py-12">
                        <BarChart3 size={48} className="text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-400">No actions yet. Run the autopilot to see its decisions here.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {recentActions.map((action: any, i: number) => {
                            const details = action.details || {};
                            const priorityColors: Record<string, string> = {
                                high: 'bg-red-100 text-red-700 border-red-200',
                                medium: 'bg-amber-100 text-amber-700 border-amber-200',
                                low: 'bg-blue-100 text-blue-700 border-blue-200',
                            };
                            return (
                                <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <ChevronRight size={16} className="text-gray-400" />
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">{details.description || action.type}</p>
                                            {details.result && <p className="text-xs text-gray-500">{details.result}</p>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {details.priority && (
                                            <span className={`text-xs font-bold px-2 py-1 rounded-full border ${priorityColors[details.priority] || 'bg-gray-100 text-gray-600'}`}>
                                                {details.priority.toUpperCase()}
                                            </span>
                                        )}
                                        <span className="text-xs text-gray-400">
                                            {new Date(action.timestamp * 1000).toLocaleString()}
                                        </span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </motion.div>
        </div>
    );
}
