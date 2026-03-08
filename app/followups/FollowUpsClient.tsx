'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
    GitBranch, Plus, Trash2, GripVertical, Clock, Mail,
    Calendar, ChevronRight, CheckSquare, Save, Loader2,
    ArrowDown, Info, Sparkles
} from 'lucide-react';

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.35 } })
};

interface FollowUp {
    id?: number;
    step_number: number;
    delay_days: number;
    delay_hours: number;
    send_time: string;
    subject: string;
    body: string;
    stop_on_reply: boolean;
    stop_on_bounce: boolean;
    template_id?: number;
}

export default function FollowUpsClient() {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);
    const [selectedCampaign, setSelectedCampaign] = useState<string>('');
    const [followUps, setFollowUps] = useState<FollowUp[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => { loadBase(); }, []);

    useEffect(() => {
        if (selectedCampaign) loadFollowUps(selectedCampaign);
    }, [selectedCampaign]);

    async function loadBase() {
        setLoading(true);
        try {
            const [cRes, tRes] = await Promise.all([fetch('/api/campaigns'), fetch('/api/templates')]);
            const c = await cRes.json();
            const t = await tRes.json();
            setCampaigns(Array.isArray(c) ? c : []);
            setTemplates(Array.isArray(t) ? t : []);
            if (Array.isArray(c) && c.length > 0) setSelectedCampaign(String(c[0].id));
        } finally {
            setLoading(false);
        }
    }

    async function loadFollowUps(campaignId: string) {
        try {
            const res = await fetch(`/api/follow-ups?campaign_id=${campaignId}`);
            const data = await res.json();
            setFollowUps(Array.isArray(data) ? data.map((f: any) => ({ ...f, stop_on_reply: !!f.stop_on_reply, stop_on_bounce: !!f.stop_on_bounce })) : []);
        } catch (e) {
            setFollowUps([]);
        }
    }

    function addStep() {
        const maxStep = followUps.length > 0 ? Math.max(...followUps.map(f => f.step_number)) : 0;
        setFollowUps([...followUps, {
            step_number: maxStep + 1,
            delay_days: 3,
            delay_hours: 0,
            send_time: '09:00',
            subject: '',
            body: '',
            stop_on_reply: true,
            stop_on_bounce: true,
        }]);
    }

    function removeStep(index: number) {
        setFollowUps(prev => {
            const updated = prev.filter((_, i) => i !== index);
            return updated.map((f, i) => ({ ...f, step_number: i + 1 }));
        });
    }

    function updateStep(index: number, updates: Partial<FollowUp>) {
        setFollowUps(prev => prev.map((f, i) => i === index ? { ...f, ...updates } : f));
    }

    async function saveAll() {
        if (!selectedCampaign) return alert('Select a campaign first');
        setSaving(true);
        try {
            // Delete existing and recreate (simple approach)
            for (const fu of followUps) {
                if (fu.id) {
                    await fetch(`/api/follow-ups/${fu.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...fu, body: fu.body })
                    });
                } else {
                    await fetch('/api/follow-ups', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...fu, campaign_id: selectedCampaign })
                    });
                }
            }
            await loadFollowUps(selectedCampaign);
            alert('✅ Follow-up sequence saved!');
        } catch (e) {
            alert('❌ Failed to save');
        } finally {
            setSaving(false);
        }
    }

    async function deleteStep(fu: FollowUp, index: number) {
        if (fu.id) {
            await fetch(`/api/follow-ups/${fu.id}`, { method: 'DELETE' });
        }
        removeStep(index);
    }

    async function aiSuggestBody(index: number) {
        try {
            const res = await fetch('/api/ai/suggest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'followup', company: '' })
            });
            const data = await res.json();
            updateStep(index, { subject: data.subject, body: data.body });
        } catch (e) {
            alert('AI suggestion unavailable');
        }
    }

    const selectedCampaignName = campaigns.find(c => String(c.id) === selectedCampaign)?.name;

    if (loading) {
        return <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 size={32} className="animate-spin text-blue-500" />
        </div>;
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp}
                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
                        <GitBranch className="text-purple-600" size={32} /> Follow-Up Builder
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Visual timeline for unlimited follow-up sequences</p>
                </div>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={saveAll} disabled={saving || !selectedCampaign}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-violet-700 text-white rounded-xl font-semibold shadow-lg shadow-purple-200 disabled:opacity-50">
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {saving ? 'Saving...' : 'Save Sequence'}
                </motion.button>
            </motion.div>

            {/* Campaign Selector */}
            <motion.div initial="hidden" animate="visible" custom={1} variants={fadeUp}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">Select Campaign</label>
                {campaigns.length === 0 ? (
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-center gap-3">
                        <Info size={18} className="text-amber-600" />
                        <p className="text-amber-800 text-sm">No campaigns found. <a href="/campaigns" className="underline font-semibold">Create one first</a></p>
                    </div>
                ) : (
                    <select
                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                        value={selectedCampaign}
                        onChange={e => setSelectedCampaign(e.target.value)}
                    >
                        {campaigns.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                )}
            </motion.div>

            {/* Timeline */}
            {selectedCampaign && (
                <div className="space-y-0">
                    {/* Initial Email Node */}
                    <motion.div initial="hidden" animate="visible" custom={2} variants={fadeUp}
                        className="relative flex gap-6">
                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-blue-200">
                                1
                            </div>
                            {followUps.length > 0 && <div className="w-0.5 h-full bg-gradient-to-b from-blue-300 to-purple-300 mt-2 min-h-[40px]" />}
                        </div>
                        <div className="flex-1 pb-8">
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 p-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <Mail size={18} className="text-blue-600" />
                                    <span className="font-bold text-blue-800">Initial Email</span>
                                    <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">Campaign: {selectedCampaignName}</span>
                                </div>
                                <p className="text-sm text-blue-600">Your main campaign email — sent first to all contacts</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Follow-Up Steps */}
                    <AnimatePresence>
                        {followUps.map((fu, index) => (
                            <motion.div key={`${fu.id}-${index}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="relative flex gap-6">
                                {/* Timeline connector */}
                                <div className="flex flex-col items-center">
                                    <div className="w-0.5 h-6 bg-gradient-to-b from-purple-300 to-purple-400" />
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white font-black shadow-lg shadow-purple-200 border-2 border-white">
                                        {index + 2}
                                    </div>
                                    {index < followUps.length - 1 && <div className="w-0.5 flex-1 bg-gradient-to-b from-purple-300 to-purple-400 mt-2 min-h-[40px]" />}
                                </div>

                                {/* Step Card */}
                                <div className="flex-1 pb-6 pt-6">
                                    <div className="bg-white rounded-2xl border-2 border-purple-100 shadow-lg p-6">
                                        {/* Step Header */}
                                        <div className="flex items-center justify-between mb-5">
                                            <div className="flex items-center gap-2">
                                                <GitBranch size={18} className="text-purple-600" />
                                                <span className="font-bold text-gray-900">Follow-Up #{index + 1}</span>
                                                {fu.id && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Saved</span>}
                                            </div>
                                            <button onClick={() => deleteStep(fu, index)}
                                                className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        {/* Delay Config */}
                                        <div className="grid grid-cols-3 gap-4 mb-5 p-4 bg-purple-50 rounded-xl border border-purple-100">
                                            <div>
                                                <label className="block text-xs font-bold text-purple-700 mb-1 flex items-center gap-1">
                                                    <Calendar size={12} /> Delay (Days)
                                                </label>
                                                <input type="number" min={0} max={365}
                                                    className="w-full p-2 border border-purple-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                                                    value={fu.delay_days}
                                                    onChange={e => updateStep(index, { delay_days: parseInt(e.target.value) || 0 })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-purple-700 mb-1 flex items-center gap-1">
                                                    <Clock size={12} /> Delay (Hours)
                                                </label>
                                                <input type="number" min={0} max={23}
                                                    className="w-full p-2 border border-purple-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                                                    value={fu.delay_hours}
                                                    onChange={e => updateStep(index, { delay_hours: parseInt(e.target.value) || 0 })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-purple-700 mb-1 flex items-center gap-1">
                                                    <Clock size={12} /> Send Time
                                                </label>
                                                <input type="time"
                                                    className="w-full p-2 border border-purple-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                                                    value={fu.send_time}
                                                    onChange={e => updateStep(index, { send_time: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        {/* Stop Conditions */}
                                        <div className="flex gap-4 mb-5">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" checked={fu.stop_on_reply}
                                                    onChange={e => updateStep(index, { stop_on_reply: e.target.checked })}
                                                    className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                                                />
                                                <span className="text-sm font-medium text-gray-700">Stop if reply detected</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" checked={fu.stop_on_bounce}
                                                    onChange={e => updateStep(index, { stop_on_bounce: e.target.checked })}
                                                    className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                                                />
                                                <span className="text-sm font-medium text-gray-700">Stop if bounced</span>
                                            </label>
                                        </div>

                                        {/* Template or Custom */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <label className="block text-sm font-bold text-gray-700">Email Content</label>
                                                <button onClick={() => aiSuggestBody(index)}
                                                    className="flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-200 transition-colors font-semibold">
                                                    <Sparkles size={12} /> AI Suggest
                                                </button>
                                            </div>
                                            <select
                                                className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                                                value={fu.template_id || ''}
                                                onChange={e => {
                                                    const tplId = e.target.value ? parseInt(e.target.value) : undefined;
                                                    const tpl = templates.find(t => t.id === tplId);
                                                    updateStep(index, { template_id: tplId, subject: tpl?.subject || fu.subject, body: tpl?.body || fu.body });
                                                }}
                                            >
                                                <option value="">-- Custom (write below) --</option>
                                                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                            </select>
                                            <input
                                                className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                                placeholder="Follow-up email subject..."
                                                value={fu.subject}
                                                onChange={e => updateStep(index, { subject: e.target.value })}
                                            />
                                            <textarea
                                                rows={4}
                                                className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-y"
                                                placeholder="Hi {{firstName}},&#10;&#10;Just following up on my previous email..."
                                                value={fu.body}
                                                onChange={e => updateStep(index, { body: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Add Step Button */}
                    <motion.div initial="hidden" animate="visible" custom={3} variants={fadeUp}
                        className="flex gap-6">
                        <div className="flex flex-col items-center">
                            {followUps.length > 0 && <div className="w-0.5 h-6 bg-gradient-to-b from-purple-300 to-gray-200" />}
                        </div>
                        <div className="flex-1 pb-6 pt-2">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={addStep}
                                className="w-full py-4 border-2 border-dashed border-purple-200 rounded-2xl text-purple-600 hover:border-purple-400 hover:bg-purple-50 transition-all flex items-center justify-center gap-2 font-semibold"
                            >
                                <Plus size={20} /> Add Follow-Up Step
                            </motion.button>
                        </div>
                    </motion.div>

                    {followUps.length > 0 && (
                        <motion.div initial="hidden" animate="visible" custom={4} variants={fadeUp}
                            className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-2xl border border-purple-200 p-6">
                            <h3 className="font-bold text-purple-800 mb-3 flex items-center gap-2">
                                <Info size={18} /> Sequence Summary
                            </h3>
                            <div className="flex flex-wrap gap-3">
                                <div className="text-sm bg-white rounded-xl px-4 py-2 border border-purple-200 font-medium">
                                    📧 {1 + followUps.length} total emails in sequence
                                </div>
                                <div className="text-sm bg-white rounded-xl px-4 py-2 border border-purple-200 font-medium">
                                    📅 {followUps.reduce((s, f) => s + f.delay_days, 0)} total days span
                                </div>
                                <div className="text-sm bg-white rounded-xl px-4 py-2 border border-purple-200 font-medium">
                                    ✋ {followUps.filter(f => f.stop_on_reply).length}/{followUps.length} stop on reply
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            )}
        </div>
    );
}
