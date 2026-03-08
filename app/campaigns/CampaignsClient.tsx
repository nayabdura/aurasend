'use client';

import { useState, useEffect } from 'react';
import {
    Play, Pause, Loader2, Plus, Edit, Trash, FileText, CheckSquare,
    Upload, X, Mail, CheckCircle, Sparkles, TrendingUp, TestTube,
    Clock, BarChart2, RefreshCw, Eye, MessageSquare, AlertCircle,
    ChevronDown, ChevronUp, Send, User, Calendar, Activity, Zap, Timer, GitBranch
} from 'lucide-react';
import RichTextEditor from '@/components/RichTextEditor';
import { motion, AnimatePresence } from 'framer-motion';
import TestingCenterClient from '../test/TestingCenterClient';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTs(ts: number | null | undefined): string {
    if (!ts) return '—';
    // Handle both Unix ms and Unix seconds
    const ms = ts > 1e12 ? ts : ts * 1000;
    return new Date(ms).toLocaleString('en-PK', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
    });
}

function timeAgo(ts: number | null | undefined): string {
    if (!ts) return '';
    const ms = ts > 1e12 ? ts : ts * 1000;
    const diff = Date.now() - ms;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        sent: 'bg-indigo-100 text-indigo-700',
        pending: 'bg-slate-100 text-slate-600',
        bounced: 'bg-rose-100 text-rose-700',
        replied: 'bg-emerald-100 text-emerald-700',
        unsubscribed: 'bg-orange-100 text-orange-700',
        opened: 'bg-amber-100 text-amber-700',
    };
    return (
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${map[status] || 'bg-slate-100 text-slate-500'}`}>
            {status}
        </span>
    );
}

// ─── Campaign Logs Panel ─────────────────────────────────────────────────────

function CampaignLogsPanel({ campaign, onClose }: { campaign: any; onClose: () => void }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');

    useEffect(() => {
        setLoading(true);
        fetch(`/api/campaigns/${campaign.id}/logs`)
            .then(r => r.json())
            .then(d => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, [campaign.id]);

    const leads = data?.leads || [];
    const stats = data?.stats || {};
    const filtered = filter === 'all' ? leads : leads.filter((l: any) => l.status === filter);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-end"
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="w-full max-w-3xl h-screen bg-white shadow-2xl flex flex-col"
            >
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-200 bg-slate-50">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{campaign.name}</h2>
                            <p className="text-sm text-slate-500 mt-0.5">Send log & delivery status</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                            <X size={20} className="text-slate-600" />
                        </button>
                    </div>

                    {/* Stats row */}
                    {!loading && (
                        <div className="grid grid-cols-5 gap-3">
                            {[
                                { label: 'Total', value: stats.total ?? 0, icon: <User size={14} />, color: 'text-slate-600' },
                                { label: 'Sent', value: stats.sent ?? 0, icon: <Send size={14} />, color: 'text-indigo-600' },
                                { label: 'Opened', value: stats.opened ?? 0, icon: <Eye size={14} />, color: 'text-amber-600' },
                                { label: 'Replied', value: stats.replied ?? 0, icon: <MessageSquare size={14} />, color: 'text-emerald-600' },
                                { label: 'Bounced', value: stats.bounced ?? 0, icon: <AlertCircle size={14} />, color: 'text-rose-600' },
                            ].map(s => (
                                <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-3 text-center">
                                    <div className={`flex items-center justify-center gap-1 ${s.color} mb-1`}>{s.icon}</div>
                                    <div className="text-xl font-black text-slate-900">{s.value}</div>
                                    <div className="text-xs text-slate-400 font-semibold">{s.label}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Filter bar */}
                <div className="px-8 py-3 border-b border-slate-100 flex items-center gap-2 bg-white">
                    {['all', 'pending', 'sent', 'opened', 'replied', 'bounced'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${filter === f ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                        >
                            {f}
                        </button>
                    ))}
                    <span className="ml-auto text-xs text-slate-400">{filtered.length} leads</span>
                </div>

                {/* Leads list */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 size={32} className="animate-spin text-indigo-400" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-20">
                            <Mail size={40} className="text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium">No leads match this filter.</p>
                            {stats.total === 0 && (
                                <p className="text-slate-400 text-sm mt-2">Upload a CSV to add leads to this campaign.</p>
                            )}
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {filtered.map((lead: any) => (
                                <div key={lead.id} className="px-8 py-4 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-semibold text-slate-900 text-sm truncate">
                                                    {lead.name || lead.email}
                                                </span>
                                                <StatusBadge status={lead.status} />
                                                {lead.opened === 1 && (
                                                    <span className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-full font-bold">
                                                        <Eye size={10} /> OPENED
                                                    </span>
                                                )}
                                                {lead.replied === 1 && (
                                                    <span className="flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full font-bold">
                                                        <MessageSquare size={10} /> REPLIED
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-slate-400">{lead.email}</div>
                                            {lead.company && <div className="text-xs text-slate-400">{lead.company}</div>}
                                        </div>
                                        <div className="text-right shrink-0">
                                            {lead.sent_at ? (
                                                <>
                                                    <div className="text-xs font-semibold text-indigo-600 flex items-center gap-1 justify-end">
                                                        <Send size={11} /> Sent via {lead.sender_email || 'unknown'}
                                                    </div>
                                                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 justify-end">
                                                        <Clock size={11} /> {formatTs(lead.sent_at)}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 mt-0.5">{timeAgo(lead.sent_at)}</div>
                                                </>
                                            ) : (
                                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                                    <Clock size={11} /> Not sent yet
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Follow-up timeline */}
                                    {(lead.followup1_sent_at || lead.followup2_sent_at) && (
                                        <div className="mt-2 ml-1 pl-3 border-l-2 border-indigo-100 space-y-1">
                                            {lead.followup1_sent_at && (
                                                <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-300 shrink-0"></span>
                                                    Follow-up 1 sent · {formatTs(lead.followup1_sent_at)}
                                                </div>
                                            )}
                                            {lead.followup2_sent_at && (
                                                <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0"></span>
                                                    Follow-up 2 sent · {formatTs(lead.followup2_sent_at)}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Reply/open timestamps */}
                                    <div className="flex gap-4 mt-1.5">
                                        {lead.opened_at && (
                                            <span className="text-[10px] text-amber-600 flex items-center gap-1">
                                                <Eye size={10} /> Opened {timeAgo(lead.opened_at)}
                                            </span>
                                        )}
                                        {lead.replied_at && (
                                            <span className="text-[10px] text-emerald-600 flex items-center gap-1">
                                                <MessageSquare size={10} /> Replied {timeAgo(lead.replied_at)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CampaignsPage() {
    const [view, setView] = useState<'list' | 'create' | 'templates' | 'testing'>('list');
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeLogs, setActiveLogs] = useState<any>(null); // campaign whose logs to show
    const [refreshing, setRefreshing] = useState<number | null>(null);
    const [sending, setSending] = useState<number | null>(null); // campaign id being manually sent
    const [uploadResult, setUploadResult] = useState<{ added: number; total: number } | null>(null);

    // Form States
    const [editingCampaign, setEditingCampaign] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '', template_id: '', template_id_b: '',
        account_ids: [] as number[],
        send_start: '08:00', send_end: '18:00',
        followup1_delay_hours: 48, followup2_delay_hours: 96,
        followup1_template_id: '', followup2_template_id: '',
        followup_enabled: true,
    });
    const [file, setFile] = useState<File | null>(null);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
    const [saveMessage, setSaveMessage] = useState('');

    // Template Form
    const [editingTemplate, setEditingTemplate] = useState<any>(null);
    const [templateData, setTemplateData] = useState({ name: '', subject: '', body: '' });

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        const [cRes, tRes, aRes] = await Promise.all([
            fetch('/api/campaigns'),
            fetch('/api/templates'),
            fetch('/api/gmail/accounts')
        ]);
        setCampaigns(await cRes.json());
        setTemplates(await tRes.json());
        setAccounts(await aRes.json());
        setLoading(false);
    }

    async function refreshCampaign(id: number) {
        setRefreshing(id);
        const res = await fetch('/api/campaigns');
        setCampaigns(await res.json());
        setRefreshing(null);
    }

    async function handleSaveCampaign() {
        if (!formData.name) { setSaveMessage('Campaign name is required'); setSaveStatus('error'); return; }
        if (!formData.template_id) { setSaveMessage('Please select an email template'); setSaveStatus('error'); return; }
        if (formData.account_ids.length === 0) { setSaveMessage('Please select at least one Gmail account'); setSaveStatus('error'); return; }

        setSaveStatus('saving');
        setSaveMessage('');

        const body = {
            ...formData,
            template_id: formData.template_id ? Number(formData.template_id) : null,
            template_id_b: formData.template_id_b ? Number(formData.template_id_b) : null,
            followup1_template_id: formData.followup1_template_id ? Number(formData.followup1_template_id) : null,
            followup2_template_id: formData.followup2_template_id ? Number(formData.followup2_template_id) : null,
            account_ids: formData.account_ids,
        };

        let campaignId = editingCampaign?.id;
        try {
            if (editingCampaign) {
                const res = await fetch(`/api/campaigns/${editingCampaign.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                if (!res.ok) { const j = await res.json(); throw new Error(j.error || 'Update failed'); }
            } else {
                const res = await fetch('/api/campaigns', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                const json = await res.json();
                if (!res.ok) throw new Error(json.error || 'Create failed');
                campaignId = json.id;
            }

            // Upload CSV leads
            if (file && campaignId) {
                const data = new FormData();
                data.append('file', file);
                data.append('campaign_id', String(campaignId));
                const uploadRes = await fetch('/api/leads/upload', { method: 'POST', body: data });
                const uploadJson = await uploadRes.json();
                if (!uploadRes.ok) throw new Error(uploadJson.error || 'CSV upload failed');
                setUploadResult({ added: uploadJson.added || 0, total: uploadJson.total || 0 });
                setSaveMessage(`✅ Campaign saved! ${uploadJson.added} leads uploaded.`);
                setSaveStatus('success');
                await new Promise(r => setTimeout(r, 2000));
            } else {
                setSaveStatus('success');
                setSaveMessage('✅ Campaign saved!');
                await new Promise(r => setTimeout(r, 800));
            }

            setView('list');
            setEditingCampaign(null);
            setFile(null);
            setUploadResult(null);
            setSaveStatus('idle');
            const blankForm = { name: '', template_id: '', template_id_b: '', account_ids: [], send_start: '08:00', send_end: '18:00', followup1_delay_hours: 48, followup2_delay_hours: 96, followup1_template_id: '', followup2_template_id: '', followup_enabled: true };
            setFormData(blankForm);
            loadData();
        } catch (e: any) {
            setSaveStatus('error');
            setSaveMessage(`Error: ${e.message}`);
        }
    }

    async function deleteCampaign(id: number) {
        if (!confirm('Delete this campaign and all its leads?')) return;
        await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
        loadData();
    }

    async function toggleCampaignStatus(c: any) {
        const newStatus = c.status === 'running' ? 'paused' : 'running';
        await fetch(`/api/campaigns/${c.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        loadData();
    }

    async function handleSaveTemplate() {
        if (!templateData.name || !templateData.subject || !templateData.body) return alert('All fields required');
        try {
            if (editingTemplate) {
                await fetch(`/api/templates/${editingTemplate.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(templateData)
                });
            } else {
                await fetch('/api/templates', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(templateData)
                });
            }
            setEditingTemplate(null);
            setTemplateData({ name: '', subject: '', body: '' });
            loadData();
        } catch (e) { alert('Failed to save template'); }
    }

    async function manualSend(campaign: any) {
        if (!confirm(`Send emails now for "${campaign.name}"? This bypasses the time window and sends immediately.`)) return;
        setSending(campaign.id);
        try {
            const res = await fetch(`/api/campaigns/${campaign.id}/send`, { method: 'POST' });
            const json = await res.json();
            if (json.success) {
                alert(`✅ ${json.message}\n\nCounts: ${json.counts?.sent || 0} sent, ${json.counts?.pending || 0} pending`);
                loadData();
            } else {
                alert(`❌ Error: ${json.error}`);
            }
        } catch (e: any) {
            alert(`❌ Network error: ${e.message}`);
        } finally {
            setSending(null);
        }
    }

    async function deleteTemplate(id: number) {
        if (!confirm('Delete this template?')) return;
        await fetch(`/api/templates/${id}`, { method: 'DELETE' });
        loadData();
    }

    if (loading) return (
        <div className="flex items-center justify-center py-24">
            <Loader2 size={32} className="animate-spin text-indigo-400" />
        </div>
    );

    // ── Testing view ──────────────────────────────────────────────────────────
    if (view === 'testing') {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Testing Center</h1>
                        <p className="text-slate-500 mt-1">Verify emails and test templates safely</p>
                    </div>
                    <button onClick={() => setView('list')} className="text-slate-600 hover:text-slate-900 font-semibold px-4 py-2 hover:bg-slate-100 rounded-xl transition-colors">
                        ← Back
                    </button>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200">
                    <TestingCenterClient />
                </div>
            </div>
        );
    }

    // ── Templates view ────────────────────────────────────────────────────────
    if (view === 'templates') {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Email Templates</h1>
                        <p className="text-slate-500 mt-1">Create and manage reusable email sequences</p>
                    </div>
                    <button onClick={() => setView('list')} className="text-slate-600 hover:text-slate-900 font-semibold px-4 py-2 hover:bg-slate-100 rounded-xl transition-colors">
                        ← Back
                    </button>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold mb-5 text-slate-900">{editingTemplate ? 'Edit Template' : 'New Template'}</h2>
                    <div className="space-y-4">
                        <input placeholder="Template Name" className="w-full p-3 border border-slate-200 bg-slate-50 text-slate-900 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" value={templateData.name} onChange={e => setTemplateData({ ...templateData, name: e.target.value })} />
                        <input placeholder="Email Subject" className="w-full p-3 border border-slate-200 bg-slate-50 text-slate-900 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" value={templateData.subject} onChange={e => setTemplateData({ ...templateData, subject: e.target.value })} />
                        <div className="flex justify-end -mb-1">
                            <button onClick={async () => {
                                const res = await fetch('/api/ai/suggest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'outreach', company: '' }) });
                                const d = await res.json();
                                setTemplateData({ ...templateData, subject: d.subject, body: d.body });
                            }} className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-indigo-100 transition-colors font-medium">
                                <Sparkles size={13} /> AI Suggest
                            </button>
                        </div>
                        <div>
                            <RichTextEditor value={templateData.body} onChange={val => setTemplateData({ ...templateData, body: val })} placeholder="Email Body..." />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={handleSaveTemplate} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 font-semibold transition-colors">Save Template</button>
                            {editingTemplate && <button onClick={() => { setEditingTemplate(null); setTemplateData({ name: '', subject: '', body: '' }); }} className="bg-slate-100 text-slate-700 px-6 py-2.5 rounded-xl hover:bg-slate-200 font-semibold transition-colors">Cancel</button>}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map(t => (
                        <div key={t.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-all">
                            <h3 className="font-bold text-slate-900">{t.name}</h3>
                            <p className="text-sm text-slate-500 truncate mt-1">{t.subject}</p>
                            <div className="mt-4 flex gap-2">
                                <button onClick={() => { setEditingTemplate(t); setTemplateData(t); }} className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit size={16} /></button>
                                <button onClick={() => deleteTemplate(t.id)} className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash size={16} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // ── Create/Edit view ──────────────────────────────────────────────────────
    if (view === 'create') {
        return (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto bg-white p-10 rounded-3xl shadow-sm border border-slate-200 space-y-8">
                <div className="flex justify-between items-center pb-6 border-b border-slate-200">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{editingCampaign ? 'Edit Campaign' : 'New Campaign'}</h1>
                        <p className="text-sm text-slate-500 mt-1">Configure your email outreach settings</p>
                    </div>
                    <button onClick={() => setView('list')} className="text-slate-600 hover:text-slate-900 flex items-center gap-2 p-2 hover:bg-slate-100 rounded-xl transition-colors">
                        <X size={20} /> <span className="font-medium">Cancel</span>
                    </button>
                </div>

                <div className="space-y-6">
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                        <label className="block text-sm font-semibold mb-2 text-slate-700">Campaign Name *</label>
                        <input className="w-full p-3 bg-white border border-slate-300 text-slate-900 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-400" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Q1 Agency Outreach" />
                    </div>

                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                        <label className="block text-sm font-semibold mb-2 text-slate-700 flex items-center gap-2"><FileText size={16} className="text-indigo-500" /> Email Template *</label>
                        <div className="flex gap-3">
                            <select className="flex-1 p-3 bg-white border border-slate-300 text-slate-900 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.template_id} onChange={e => setFormData({ ...formData, template_id: e.target.value })}>
                                <option value="">-- Select Template A --</option>
                                {templates.map(t => <option key={t.id} value={t.id}>{t.name} · {t.subject}</option>)}
                            </select>
                            <button onClick={() => setView('templates')} className="px-5 py-3 bg-slate-100 text-slate-800 rounded-xl hover:bg-slate-200 flex items-center gap-2 whitespace-nowrap font-medium border border-slate-300 transition-colors">
                                <Plus size={18} /> New
                            </button>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-200">
                            <label className="block text-xs font-semibold mb-2 text-slate-500 flex items-center gap-2"> A/B Split Test (Optional Template B)</label>
                            <select className="w-full p-3 bg-white border border-slate-300 text-slate-900 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.template_id_b} onChange={e => setFormData({ ...formData, template_id_b: e.target.value })}>
                                <option value="">-- Pick Template B (Optional) --</option>
                                {templates.map(t => <option key={t.id} value={t.id}>{t.name} · {t.subject}</option>)}
                            </select>
                            <p className="text-[11px] text-slate-500 mt-1.5">If selected, the system will randomly 50/50 split the leads between Template A and B.</p>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                        <label className="block text-sm font-semibold mb-2 text-slate-700 flex items-center gap-2"><Mail size={16} className="text-emerald-500" /> Sending Accounts *</label>
                        <p className="text-xs text-slate-400 mb-3">Select one or more accounts for this campaign.</p>
                        <div className="max-h-48 overflow-y-auto border border-slate-200 bg-white rounded-xl p-2 space-y-1">
                            {accounts.length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-6">No Gmail accounts connected. <a href="/gmail" className="text-indigo-600 hover:underline">Add one</a></p>
                            ) : accounts.map(acc => (
                                <label key={acc.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                                    <input type="checkbox" checked={formData.account_ids.includes(acc.id)} onChange={e => {
                                        if (e.target.checked) setFormData({ ...formData, account_ids: [...formData.account_ids, acc.id] });
                                        else setFormData({ ...formData, account_ids: formData.account_ids.filter(id => id !== acc.id) });
                                    }} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                                    <div className="flex-1">
                                        <span className="text-sm font-medium text-slate-800">{acc.email}</span>
                                        <span className="text-xs text-slate-400 ml-2">({acc.sent_today}/{acc.daily_limit} today)</span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                        <label className="block text-sm font-semibold mb-2 text-slate-700 flex items-center gap-2"><Timer size={16} className="text-amber-500" /> Upload Leads (CSV)</label>
                        <input type="file" accept=".csv" onChange={e => setFile(e.target.files?.[0] || null)} className="block w-full text-sm text-slate-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 file:cursor-pointer transition-colors" />
                        {file && (
                            <div className="mt-3 p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CheckCircle size={18} className="text-emerald-500" />
                                    <span className="text-sm font-medium text-slate-800">{file.name}</span>
                                    <span className="text-xs text-slate-400">({(file.size / 1024).toFixed(1)} KB)</span>
                                </div>
                                <button onClick={() => setFile(null)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><X size={14} /></button>
                            </div>
                        )}
                        {uploadResult && (
                            <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-sm text-emerald-700 font-semibold">
                                <CheckCircle size={16} /> Uploaded: {uploadResult.added} leads added / {uploadResult.total} rows processed
                            </div>
                        )}
                        <p className="text-xs text-slate-400 mt-2">Columns: <code className="bg-slate-100 px-1 rounded">name, email, company</code> (case-insensitive, works with Excel exports)</p>
                    </div>

                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                        <label className="block text-sm font-semibold mb-3 text-slate-700 flex items-center gap-2"><Clock size={16} className="text-indigo-500" /> Send Time Window</label>
                        <p className="text-xs text-slate-400 mb-3">Emails will only auto-send during this window. Use "Send Now" to bypass it immediately.</p>
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <label className="text-xs text-slate-500 font-semibold mb-1 block">Start Time</label>
                                <input type="time" value={formData.send_start} onChange={e => setFormData({ ...formData, send_start: e.target.value })}
                                    className="w-full p-3 bg-white border border-slate-300 text-slate-900 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                            <div className="text-slate-400 font-bold mt-5">→</div>
                            <div className="flex-1">
                                <label className="text-xs text-slate-500 font-semibold mb-1 block">End Time</label>
                                <input type="time" value={formData.send_end} onChange={e => setFormData({ ...formData, send_end: e.target.value })}
                                    className="w-full p-3 bg-white border border-slate-300 text-slate-900 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                        </div>
                    </div>

                    {/* Follow-up Settings */}
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <GitBranch size={16} className="text-violet-500" /> Follow-Up Sequence
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <span className="text-xs text-slate-500">Enable</span>
                                <input type="checkbox" checked={formData.followup_enabled}
                                    onChange={e => setFormData({ ...formData, followup_enabled: e.target.checked })}
                                    className="w-4 h-4 rounded text-indigo-600" />
                            </label>
                        </div>
                        {formData.followup_enabled && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 mb-1 block">Follow-up 1 — delay (hours after initial)</label>
                                        <input type="number" min="1" max="720" value={formData.followup1_delay_hours}
                                            onChange={e => setFormData({ ...formData, followup1_delay_hours: Number(e.target.value) })}
                                            className="w-full p-3 bg-white border border-slate-300 text-slate-900 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 mb-1 block">Follow-up 2 — delay (hours after F1)</label>
                                        <input type="number" min="1" max="720" value={formData.followup2_delay_hours}
                                            onChange={e => setFormData({ ...formData, followup2_delay_hours: Number(e.target.value) })}
                                            className="w-full p-3 bg-white border border-slate-300 text-slate-900 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 mb-1 block">Follow-up 1 Template (optional)</label>
                                        <div className="flex gap-2">
                                            <select value={formData.followup1_template_id} onChange={e => setFormData({ ...formData, followup1_template_id: e.target.value })}
                                                className="flex-1 p-3 bg-white border border-slate-300 text-slate-900 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
                                                <option value="">-- Same as main (auto) --</option>
                                                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                            </select>
                                            <button onClick={() => setView('templates')} className="px-3 py-3 bg-slate-100 text-slate-800 rounded-xl hover:bg-slate-200 flex items-center gap-1 font-medium border border-slate-300 transition-colors tooltip" title="Create New">
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 mb-1 block">Follow-up 2 Template (optional)</label>
                                        <div className="flex gap-2">
                                            <select value={formData.followup2_template_id} onChange={e => setFormData({ ...formData, followup2_template_id: e.target.value })}
                                                className="flex-1 p-3 bg-white border border-slate-300 text-slate-900 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
                                                <option value="">-- Same as main (auto) --</option>
                                                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                            </select>
                                            <button onClick={() => setView('templates')} className="px-3 py-3 bg-slate-100 text-slate-800 rounded-xl hover:bg-slate-200 flex items-center gap-1 font-medium border border-slate-300 transition-colors tooltip" title="Create New">
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-[11px] text-slate-400">Follow-ups only send if the prospect has NOT replied. They stop automatically on reply.</p>
                            </div>
                        )}
                    </div>

                    {/* Status message */}
                    {saveMessage && (
                        <div className={`p-4 rounded-xl text-sm font-semibold flex items-center gap-2 ${saveStatus === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                            {saveStatus === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
                            {saveMessage}
                        </div>
                    )}

                    <div className="pt-6 border-t border-slate-200 flex justify-between items-center">
                        <button onClick={() => setView('list')} className="px-6 py-2.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors font-semibold">Cancel</button>
                        <button onClick={handleSaveCampaign} disabled={saveStatus === 'saving'} className="px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 flex items-center gap-2 shadow-md font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                            {saveStatus === 'saving' ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : <><CheckSquare size={18} /> {editingCampaign ? 'Update Campaign' : 'Launch Campaign'}</>}
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    }

    // ── Main List View ─────────────────────────────────────────────────────────
    return (
        <>
            <AnimatePresence>
                {activeLogs && <CampaignLogsPanel campaign={activeLogs} onClose={() => setActiveLogs(null)} />}
            </AnimatePresence>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                {/* Header */}
                <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm flex flex-col lg:flex-row justify-between lg:items-center gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-1">Campaigns</h1>
                        <p className="text-slate-500">Manage and monitor your automated email outreach</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => { loadData(); }} className="p-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors" title="Refresh">
                            <RefreshCw size={18} />
                        </button>
                        <button onClick={() => setView('templates')} className="px-5 py-2.5 bg-slate-100 text-slate-800 hover:bg-slate-200 rounded-xl border border-slate-300 flex items-center gap-2 font-semibold transition-colors">
                            <FileText size={18} /> Templates
                        </button>
                        <button onClick={() => setView('testing')} className="px-5 py-2.5 bg-slate-100 text-slate-800 hover:bg-slate-200 rounded-xl border border-slate-300 flex items-center gap-2 font-semibold transition-colors">
                            <TestTube size={18} /> Testing
                        </button>
                        <button onClick={() => { setEditingCampaign(null); setFormData({ name: '', template_id: '', template_id_b: '', account_ids: [], send_start: '08:00', send_end: '18:00', followup1_delay_hours: 48, followup2_delay_hours: 96, followup1_template_id: '', followup2_template_id: '', followup_enabled: true }); setView('create'); }} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-500/20 flex items-center gap-2 font-semibold transition-all hover:scale-[1.02]">
                            <Plus size={18} /> New Campaign
                        </button>
                    </div>
                </div>

                {/* Campaign Cards */}
                <div className="space-y-4">
                    {campaigns.length === 0 ? (
                        <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-200">
                            <div className="text-5xl mb-5 opacity-40">🚀</div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">No campaigns yet</h3>
                            <p className="text-slate-400 mb-6">Create your first campaign to start outreach.</p>
                            <button onClick={() => { setFormData({ name: '', template_id: '', template_id_b: '', account_ids: [], send_start: '08:00', send_end: '18:00', followup1_delay_hours: 48, followup2_delay_hours: 96, followup1_template_id: '', followup2_template_id: '', followup_enabled: true }); setView('create'); }} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors inline-flex items-center gap-2">
                                <Plus size={18} /> New Campaign
                            </button>
                        </div>
                    ) : (
                        campaigns.map((c, idx) => {
                            const template = templates.find(t => t.id === c.template_id);
                            const progress = c.lead_count > 0 ? Math.round((c.sent_count / c.lead_count) * 100) : 0;
                            const isRunning = c.status === 'running';

                            return (
                                <motion.div
                                    key={c.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all overflow-hidden"
                                >
                                    {/* Campaign header */}
                                    <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                        {/* Left: status + info */}
                                        <div className="flex items-center gap-5">
                                            <div className={`p-3 rounded-2xl ${isRunning ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                                                {isRunning ? <Play size={22} fill="currentColor" /> : <Pause size={22} fill="currentColor" />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className="text-xl font-bold text-slate-900">{c.name}</h3>
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${isRunning ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                        {c.status}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-400">
                                                    {template && (
                                                        <span className="flex items-center gap-1.5">
                                                            <FileText size={12} className="text-indigo-400" /> {template.name}
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1.5">
                                                        <Send size={12} className="text-indigo-400" />
                                                        <span className="font-bold text-slate-700">{c.sent_count}</span> / {c.lead_count} sent
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <Calendar size={12} /> Created {new Date(c.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: actions */}
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setActiveLogs(c)}
                                                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 text-sm font-semibold flex items-center gap-2 transition-colors"
                                            >
                                                <Activity size={15} /> Send Log
                                            </button>
                                            <button
                                                onClick={() => manualSend(c)}
                                                disabled={sending === c.id}
                                                className="px-3 py-2 rounded-xl border border-orange-200 text-orange-600 hover:bg-orange-50 text-sm font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                                                title="Send Now (ignores time window)"
                                            >
                                                {sending === c.id ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
                                                {sending === c.id ? 'Sending...' : 'Send Now'}
                                            </button>
                                            <button
                                                onClick={() => toggleCampaignStatus(c)}
                                                className={`p-2.5 rounded-xl border transition-colors ${isRunning ? 'text-amber-500 border-amber-200 hover:bg-amber-50' : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'}`}
                                                title={isRunning ? 'Pause' : 'Start'}
                                            >
                                                {isRunning ? <Pause size={18} /> : <Play size={18} />}
                                            </button>
                                            <button onClick={async () => {
                                                setEditingCampaign(c);
                                                const res = await fetch(`/api/campaigns/${c.id}`);
                                                const full = await res.json();
                                                setFormData({ name: c.name, template_id: String(c.template_id || ''), template_id_b: String(c.template_id_b || ''), account_ids: full.accounts ? full.accounts.map((a: any) => a.id) : [], send_start: c.send_window_start || '08:00', send_end: c.send_window_end || '18:00', followup1_delay_hours: c.followup1_delay_hours || 48, followup2_delay_hours: c.followup2_delay_hours || 96, followup1_template_id: String(c.followup1_template_id || ''), followup2_template_id: String(c.followup2_template_id || ''), followup_enabled: c.followup_enabled !== 0 });
                                                setView('create');
                                            }} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl border border-slate-200 transition-colors">
                                                <Edit size={18} />
                                            </button>
                                            <button onClick={() => deleteCampaign(c.id)} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 transition-colors">
                                                <Trash size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Progress bar */}
                                    {c.lead_count > 0 && (
                                        <div className="px-6 pb-4">
                                            <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                                                <span>{c.sent_count} sent</span>
                                                <span>{progress}% complete</span>
                                            </div>
                                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${isRunning ? 'bg-indigo-500' : 'bg-slate-300'}`}
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Quick stats bar */}
                                    {c.lead_count > 0 && (
                                        <div className="border-t border-slate-100 px-6 py-3 flex gap-6 bg-slate-50/50">
                                            <StatChip icon={<User size={12} />} label="Total" value={c.lead_count} />
                                            <StatChip icon={<Send size={12} />} label="Sent" value={c.sent_count} color="indigo" />
                                            <StatChip icon={<Clock size={12} />} label="Pending" value={Math.max(0, c.lead_count - c.sent_count)} />
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </motion.div>
        </>
    );
}

function StatChip({ icon, label, value, color }: { icon: any; label: string; value: number; color?: string }) {
    return (
        <div className={`flex items-center gap-1.5 text-xs font-semibold ${color === 'indigo' ? 'text-indigo-600' : 'text-slate-500'}`}>
            {icon}
            <span className="font-bold">{value}</span>
            <span className="text-slate-400">{label}</span>
        </div>
    );
}
