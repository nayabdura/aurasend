'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Zap, ZapOff, Mail, CheckCircle, AlertCircle, Loader2,
    TrendingUp, Clock, Plus, Edit2, Trash2, ChevronDown,
    ChevronUp, Eye, Copy, FileText, RotateCcw, Activity,
    Sparkles, Shield, BarChart3, X, Save, ArrowRight, Users
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────
interface GmailAccount {
    id: number; email: string; name?: string; status: string;
    warmup_enabled: number; warmup_day: number;
    warmup_template_id: number | null; warmup_sent_today: number;
    warmup_health_score: number; sent_today: number;
    daily_limit: number; auth_method: string; is_connected: number;
    warmup_send_start?: string; warmup_send_end?: string;
}

interface WarmupTemplate {
    id: number; user_id: number; gmail_account_id: number | null;
    name: string; subject: string; body: string;
    followup1_subject: string | null; followup1_body: string | null;
    followup2_subject: string | null; followup2_body: string | null;
    is_active: number; rotation_order: number; created_at: string;
}

interface WarmupLog {
    id: number; gmail_account_id: number; gmail_email: string; account_email?: string; to_email?: string;
    subject: string; type: string; timestamp: number;
}

type Tab = 'overview' | 'templates' | 'activity';
type TemplateMode = 'list' | 'edit' | 'create';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getDailyTarget(day: number) {
    return Math.min(5 + Math.floor((day - 1) / 7) * 5, 40);
}

function getHealth(score: number, warmupEnabled: number, isConnected: number) {
    if (!isConnected) return { label: 'Disconnected', color: 'red', bg: 'bg-rose-100 text-rose-700', bar: 'bg-rose-500' };
    if (!warmupEnabled) return { label: 'Warmup Off', color: 'gray', bg: 'bg-white text-slate-600', bar: 'bg-gray-400' };
    if (score < 30) return { label: 'Cold', color: 'red', bg: 'bg-rose-100 text-rose-700', bar: 'bg-rose-500' };
    if (score < 55) return { label: 'Warming', color: 'yellow', bg: 'bg-yellow-100 text-yellow-700', bar: 'bg-yellow-400' };
    if (score < 75) return { label: 'Good', color: 'blue', bg: 'bg-indigo-100 text-indigo-700', bar: 'bg-indigo-500' };
    if (score < 90) return { label: 'Strong', color: 'green', bg: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-500' };
    return { label: 'Excellent', color: 'emerald', bg: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-500' };
}

const EMPTY_TEMPLATE = {
    name: '', subject: '', body: '',
    followup1_subject: '', followup1_body: '',
    followup2_subject: '', followup2_body: '',
    gmail_account_id: null as number | null,
    rotation_order: 0,
};

// ─── AI Suggestions ──────────────────────────────────────────────────────────
const AI_WARMUP_SUGGESTIONS = [
    { name: 'Casual Check-In', subject: 'Quick question for you', body: 'Hey {{name}},\n\nHope you\'re having a great week! I wanted to reach out and see how things are going on your end.\n\nWould love to connect when you have a moment.\n\nBest,\n{{sender_name}}', followup1_subject: 'Re: Quick question for you', followup1_body: 'Hey {{name}},\n\nJust wanted to follow up on my previous message. No rush at all!\n\nBest,\n{{sender_name}}' },
    { name: 'Professional Outreach', subject: 'Partnership opportunity', body: 'Hi {{name}},\n\nI\'ve been following your work and I\'m impressed. I think there might be some great synergies between our teams.\n\nWould love to connect for 15 minutes this week.\n\nThanks,\n{{sender_name}}', followup1_subject: 'Re: Partnership opportunity', followup1_body: 'Hi {{name}},\n\nI wanted to circle back on my earlier message about potentially working together.\n\nLooking forward to hearing from you!\n\nThanks,\n{{sender_name}}' },
    { name: 'Industry Insight Share', subject: 'Thought you\'d find this interesting', body: 'Hi {{name}},\n\nI came across something I thought would be valuable for someone in your position — happy to share if you\'re interested.\n\nLet me know!\n\nCheers,\n{{sender_name}}', followup1_subject: 'Re: Thought you\'d find this interesting', followup1_body: 'Hi {{name}},\n\nJust checking in — did you get a chance to see my last message?\n\nCheers,\n{{sender_name}}' },
];

// ─── Template Editor ──────────────────────────────────────────────────────────
function TemplateEditor({ accounts, initialData, onSave, onCancel }: {
    accounts: GmailAccount[];
    initialData?: Partial<typeof EMPTY_TEMPLATE> & { id?: number };
    onSave: () => void;
    onCancel: () => void;
}) {
    const [form, setForm] = useState({ ...EMPTY_TEMPLATE, ...initialData });
    const [saving, setSaving] = useState(false);
    const [showFollowup1, setShowFollowup1] = useState(!!(initialData?.followup1_body));
    const [showFollowup2, setShowFollowup2] = useState(!!(initialData?.followup2_body));
    const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
    const [aiLoading, setAiLoading] = useState(false);

    function applyAISuggestion(s: typeof AI_WARMUP_SUGGESTIONS[0]) {
        setAiLoading(true);
        setTimeout(() => {
            setForm(f => ({
                ...f,
                name: s.name,
                subject: s.subject,
                body: s.body,
                followup1_subject: s.followup1_subject || '',
                followup1_body: s.followup1_body || '',
            }));
            setShowFollowup1(true);
            setAiLoading(false);
        }, 400);
    }

    async function handleSave() {
        if (!form.name || !form.subject || !form.body) return alert('Name, Subject and Body are required.');
        setSaving(true);
        try {
            const method = initialData?.id ? 'PUT' : 'POST';
            const url = initialData?.id ? `/api/warmup/templates/${initialData.id}` : '/api/warmup/templates';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (res.ok) onSave();
            else {
                const d = await res.json();
                alert(d.error || 'Failed to save');
            }
        } finally {
            setSaving(false);
        }
    }

    const previewBody = form.body
        .replace(/{{name}}/g, 'John Doe')
        .replace(/{{sender_name}}/g, 'You')
        .replace(/{{company}}/g, 'Acme Inc.')
        .replace(/\n/g, '<br/>');

    return (
        <div className="bg-slate-50 rounded-2xl border border-slate-200 shadow-lg p-6 space-y-5">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">{initialData?.id ? '✏️ Edit Template' : '✨ New Warmup Template'}</h3>
                <button onClick={onCancel} className="p-2 hover:bg-white rounded-lg text-slate-500"><X size={18} /></button>
            </div>

            {/* AI Suggestions */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4">
                <p className="text-xs font-bold text-purple-700 mb-2 flex items-center gap-1"><Sparkles size={13} /> AI Quick-Start Templates</p>
                <div className="flex flex-wrap gap-2">
                    {AI_WARMUP_SUGGESTIONS.map((s, i) => (
                        <button key={i} onClick={() => applyAISuggestion(s)} disabled={aiLoading}
                            className="text-xs px-3 py-1.5 bg-slate-50 border border-purple-300 rounded-lg hover:bg-purple-50 hover:border-purple-500 transition-colors font-medium text-purple-700 disabled:opacity-50">
                            {aiLoading ? '...' : s.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Template Name *</label>
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none" placeholder="e.g. Casual Outreach #1" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Assign to Gmail Account</label>
                    <select value={form.gmail_account_id ?? ''} onChange={e => setForm(f => ({ ...f, gmail_account_id: e.target.value ? parseInt(e.target.value) : null }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none bg-slate-50">
                        <option value="">🌐 Global (Any Account)</option>
                        {accounts.map(a => <option key={a.id} value={a.id}>{a.email}</option>)}
                    </select>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-200 pb-0">
                <button onClick={() => setActiveTab('edit')}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'edit' ? 'border-orange-500 text-orange-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                    ✏️ Edit
                </button>
                <button onClick={() => setActiveTab('preview')}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'preview' ? 'border-orange-500 text-orange-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                    👁 Preview
                </button>
            </div>

            {activeTab === 'edit' ? (
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Subject Line *</label>
                        <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none" placeholder="Email subject..." />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Email Body * <span className="font-normal text-slate-400">(Use: {'{{name}}'}, {'{{company}}'}, {'{{sender_name}}'})</span></label>
                        <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={5}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none resize-none" placeholder="Email body..." />
                    </div>

                    {/* Follow-up 1 */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <button onClick={() => setShowFollowup1(!showFollowup1)}
                            className="w-full px-4 py-3 text-sm font-semibold text-slate-700 bg-white hover:bg-white flex items-center justify-between">
                            <span>📩 Follow-up 1 (Optional)</span>
                            {showFollowup1 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        {showFollowup1 && (
                            <div className="p-4 space-y-3 bg-slate-50">
                                <input value={form.followup1_subject || ''} onChange={e => setForm(f => ({ ...f, followup1_subject: e.target.value }))}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none" placeholder="Re: original subject..." />
                                <textarea value={form.followup1_body || ''} onChange={e => setForm(f => ({ ...f, followup1_body: e.target.value }))} rows={4}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none resize-none" placeholder="Follow-up body..." />
                            </div>
                        )}
                    </div>

                    {/* Follow-up 2 */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <button onClick={() => setShowFollowup2(!showFollowup2)}
                            className="w-full px-4 py-3 text-sm font-semibold text-slate-700 bg-white hover:bg-white flex items-center justify-between">
                            <span>📩 Follow-up 2 (Optional)</span>
                            {showFollowup2 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        {showFollowup2 && (
                            <div className="p-4 space-y-3 bg-slate-50">
                                <input value={form.followup2_subject || ''} onChange={e => setForm(f => ({ ...f, followup2_subject: e.target.value }))}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none" placeholder="Re: Re: original subject..." />
                                <textarea value={form.followup2_body || ''} onChange={e => setForm(f => ({ ...f, followup2_body: e.target.value }))} rows={4}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none resize-none" placeholder="Second follow-up body..." />
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <p className="text-xs text-slate-500 mb-1">Subject:</p>
                        <p className="font-semibold text-slate-900">{form.subject || '(no subject)'}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <p className="text-xs text-slate-500 mb-2">Body:</p>
                        <div className="text-sm text-slate-800 leading-relaxed" dangerouslySetInnerHTML={{ __html: previewBody || '(empty)' }} />
                    </div>
                    {form.followup1_body && (
                        <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
                            <p className="text-xs font-bold text-indigo-600 mb-1">Follow-up 1:</p>
                            <p className="text-sm font-semibold text-slate-700">{form.followup1_subject}</p>
                            <p className="text-xs text-slate-600 mt-1 whitespace-pre-line">{form.followup1_body}</p>
                        </div>
                    )}
                    {form.followup2_body && (
                        <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                            <p className="text-xs font-bold text-purple-600 mb-1">Follow-up 2:</p>
                            <p className="text-sm font-semibold text-slate-700">{form.followup2_subject}</p>
                            <p className="text-xs text-slate-600 mt-1 whitespace-pre-line">{form.followup2_body}</p>
                        </div>
                    )}
                </div>
            )}

            <div className="flex gap-3 pt-2">
                <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-bold text-sm shadow-md disabled:opacity-50 transition-all">
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {saving ? 'Saving...' : 'Save Template'}
                </button>
                <button onClick={onCancel} className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-white">Cancel</button>
            </div>
        </div>
    );
}

// ─── Sending Window Editor ───────────────────────────────────────────────────
function SendingWindowEditor({ account, onSave }: { account: GmailAccount; onSave: (start: string, end: string) => void }) {
    const [isEditing, setIsEditing] = useState(false);
    const [start, setStart] = useState(account.warmup_send_start || '07:00');
    const [end, setEnd] = useState(account.warmup_send_end || '20:00');

    if (!isEditing) {
        return (
            <div className="flex justify-between items-center text-xs text-slate-500 bg-white px-3 py-2 rounded-xl border border-slate-200 group">
                <span className="flex items-center gap-1"><Clock size={11} /> Warmup Window</span>
                <button onClick={() => setIsEditing(true)} className="flex items-center gap-1.5 font-bold text-slate-700 hover:text-indigo-600 transition-colors">
                    {start} — {end}
                    <Edit2 size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
            </div>
        );
    }

    return (
        <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 space-y-2">
            <div className="flex justify-between text-xs font-semibold text-indigo-900 mb-1">
                <span className="flex items-center gap-1"><Clock size={11} /> Set Window</span>
                <span className="text-indigo-600/60 font-medium">Use HH:MM format</span>
            </div>
            <div className="flex gap-2">
                <div className="flex-1">
                    <label className="text-[10px] uppercase font-bold text-indigo-600/70 ml-1">Start</label>
                    <input type="time" value={start} onChange={e => setStart(e.target.value)}
                        className="w-full text-sm font-bold bg-slate-50 border border-indigo-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
                <div className="flex-1">
                    <label className="text-[10px] uppercase font-bold text-indigo-600/70 ml-1">End</label>
                    <input type="time" value={end} onChange={e => setEnd(e.target.value)}
                        className="w-full text-sm font-bold bg-slate-50 border border-indigo-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
            </div>
            <div className="flex justify-end gap-1.5 pt-1">
                <button onClick={() => { setStart(account.warmup_send_start || '07:00'); setEnd(account.warmup_send_end || '20:00'); setIsEditing(false); }}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-md transition-colors"><X size={14} /></button>
                <button onClick={() => { onSave(start, end); setIsEditing(false); }}
                    className="p-1.5 text-indigo-600 hover:text-white bg-indigo-100 hover:bg-indigo-600 rounded-md transition-colors"><Save size={14} /></button>
            </div>
        </div>
    );
}

// ─── Main WarmupClient ────────────────────────────────────────────────────────
export default function WarmupClient() {
    const [accounts, setAccounts] = useState<GmailAccount[]>([]);
    const [templates, setTemplates] = useState<WarmupTemplate[]>([]);
    const [logs, setLogs] = useState<WarmupLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<Tab>('overview');
    const [templateMode, setTemplateMode] = useState<TemplateMode>('list');
    const [editingTemplate, setEditingTemplate] = useState<WarmupTemplate | null>(null);
    const [toggling, setToggling] = useState<number | null>(null);
    const [assigningTo, setAssigningTo] = useState<number | null>(null);
    const [managingContactsId, setManagingContactsId] = useState<number | null>(null);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [diagnosing, setDiagnosing] = useState(false);
    const [diagnoseData, setDiagnoseData] = useState<any | null>(null);
    const [triggering, setTriggering] = useState(false);

    const showToast = useCallback((type: 'success' | 'error', text: string) => {
        setToast({ type, text });
        setTimeout(() => setToast(null), 4000);
    }, []);

    const loadAll = useCallback(async () => {
        setLoading(true);
        try {
            const [accRes, tplRes, logRes] = await Promise.all([
                fetch('/api/gmail/warmup'),
                fetch('/api/warmup/templates'),
                fetch('/api/warmup/logs?limit=30'),
            ]);
            if (accRes.ok) setAccounts(await accRes.json());
            if (tplRes.ok) setTemplates(await tplRes.json());
            if (logRes.ok) { const d = await logRes.json(); setLogs(d.logs || []); }
        } catch { showToast('error', 'Failed to load data'); }
        finally { setLoading(false); }
    }, [showToast]);

    useEffect(() => { loadAll(); }, [loadAll]);

    async function toggleWarmup(account: GmailAccount) {
        setToggling(account.id);
        try {
            const res = await fetch('/api/gmail/warmup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ account_id: account.id, enabled: account.warmup_enabled === 1 ? 0 : 1 })
            });
            if (res.ok) {
                showToast('success', `Warmup ${account.warmup_enabled ? 'paused' : 'enabled'} for ${account.email}`);
                loadAll();
            } else showToast('error', 'Failed to toggle warmup');
        } finally { setToggling(null); }
    }

    async function assignTemplate(gmailId: number, templateId: number | null) {
        setAssigningTo(gmailId);
        try {
            const res = await fetch('/api/warmup/assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gmail_account_id: gmailId, warmup_template_id: templateId })
            });
            if (res.ok) { showToast('success', 'Template assigned!'); loadAll(); }
            else showToast('error', 'Failed to assign template');
        } finally { setAssigningTo(null); }
    }

    async function saveSendingWindow(accountId: number, start: string, end: string) {
        const res = await fetch('/api/warmup/window', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ account_id: accountId, start_time: start, end_time: end })
        });
        if (res.ok) { showToast('success', 'Sending window saved!'); loadAll(); }
        else showToast('error', 'Failed to save sending window');
    }

    async function deleteTemplate(id: number) {
        if (!confirm('Delete this warmup template?')) return;
        const res = await fetch(`/api/warmup/templates/${id}`, { method: 'DELETE' });
        if (res.ok) { showToast('success', 'Template deleted'); loadAll(); }
        else showToast('error', 'Delete failed');
    }

    async function runDiagnose() {
        setDiagnosing(true);
        try {
            const res = await fetch('/api/warmup/diagnose');
            if (res.ok) setDiagnoseData(await res.json());
            else showToast('error', 'Diagnose failed');
        } catch { showToast('error', 'Network error'); }
        finally { setDiagnosing(false); }
    }

    async function triggerNow() {
        setTriggering(true);
        try {
            const res = await fetch('/api/warmup/diagnose', { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                showToast('success', `Manual trigger: ${data.processed} emails sent, ${data.errors} errors`);
                loadAll();
                // Refresh diagnose if open
                if (diagnoseData) runDiagnose();
            } else showToast('error', data.error || 'Trigger failed');
        } catch { showToast('error', 'Network error'); }
        finally { setTriggering(false); }
    }

    const warmingCount = accounts.filter(a => a.warmup_enabled).length;

    if (loading) return (
        <div className="flex items-center justify-center py-32">
            <Loader2 size={36} className="animate-spin text-orange-500" />
            <span className="ml-3 text-slate-600 font-medium">Loading warm-up data...</span>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                        <span className="p-2.5 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-lg"><Zap size={26} /></span>
                        Gmail Warm-Up Studio
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm max-w-xl">Per-account warmup campaigns with dedicated templates, auto-rotation, and AI-powered suggestions.</p>
                </div>
                <div className="flex gap-3 flex-wrap">
                    <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-center min-w-[80px]">
                        <p className="text-2xl font-extrabold text-orange-600">{warmingCount}</p>
                        <p className="text-xs text-slate-500 font-medium">Warming</p>
                    </div>
                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 text-center min-w-[80px]">
                        <p className="text-2xl font-extrabold text-indigo-600">{templates.length}</p>
                        <p className="text-xs text-slate-500 font-medium">Templates</p>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-3 text-center min-w-[80px]">
                        <p className="text-2xl font-extrabold text-purple-600">{logs.length}</p>
                        <p className="text-xs text-slate-500 font-medium">Activities</p>
                    </div>
                    {/* Diagnose + Manual Trigger buttons */}
                    <button
                        onClick={runDiagnose}
                        disabled={diagnosing}
                        className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-2 border-indigo-300 hover:border-indigo-500 text-indigo-700 rounded-xl font-semibold text-sm transition-all disabled:opacity-60"
                    >
                        {diagnosing ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
                        {diagnosing ? 'Checking...' : 'Diagnose'}
                    </button>
                    <button
                        onClick={triggerNow}
                        disabled={triggering}
                        className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-semibold text-sm shadow-md transition-all disabled:opacity-60"
                    >
                        {triggering ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                        {triggering ? 'Running...' : 'Trigger Now'}
                    </button>
                </div>
            </div>

            {/* Toast */}
            {toast && (
                <div className={`flex items-center gap-3 px-5 py-4 rounded-xl font-medium shadow-md animate-pulse ${toast.type === 'success' ? 'bg-emerald-50 border border-emerald-300 text-emerald-800' : 'bg-rose-50 border border-rose-300 text-rose-800'}`}>
                    {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    {toast.text}
                </div>
            )}

            {/* Diagnose Results Panel */}
            {diagnoseData && (
                <div className="bg-slate-50 border-2 border-indigo-200 rounded-2xl shadow-md overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 bg-indigo-50 border-b border-indigo-200">
                        <div>
                            <h3 className="font-bold text-indigo-900 flex items-center gap-2"><Shield size={16} /> Warmup Diagnostics</h3>
                            <p className="text-xs text-indigo-600 mt-0.5">Cron runs every 15 min · Window: {diagnoseData.cron_window} · Next: ~{diagnoseData.next_trigger_approx}</p>
                        </div>
                        <button onClick={() => setDiagnoseData(null)} className="p-1.5 text-indigo-400 hover:text-indigo-700 hover:bg-indigo-100 rounded-lg"><X size={16} /></button>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {diagnoseData.accounts.map((acct: any) => (
                            <div key={acct.email} className="p-5">
                                <div className="flex items-start gap-3 mb-3">
                                    <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${acct.can_send ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                    <div>
                                        <p className="font-bold text-slate-900">{acct.name || acct.email}</p>
                                        {acct.name && <p className="text-xs text-slate-400">{acct.email}</p>}
                                    </div>
                                    <div className="ml-auto flex gap-4 text-xs text-slate-500">
                                        <span>Day <strong className="text-slate-800">{acct.warmup_day}</strong></span>
                                        <span>Target <strong className="text-orange-600">{acct.daily_target}/day</strong></span>
                                        <span>Sent <strong className="text-indigo-600">{acct.sent_today_actual} today</strong></span>
                                    </div>
                                </div>
                                <div className="space-y-1.5 ml-6">
                                    {acct.issues.map((issue: string, i: number) => (
                                        <div key={i} className={`text-sm px-3 py-1.5 rounded-lg ${issue.startsWith('✅') ? 'bg-emerald-50 text-emerald-800' :
                                            issue.startsWith('❌') ? 'bg-rose-50 text-rose-700' :
                                                'bg-amber-50 text-amber-700'
                                            }`}>{issue}</div>
                                    ))}
                                </div>
                                {acct.last_warmup_email && (
                                    <p className="text-xs text-slate-400 mt-2 ml-6">Last sent: <span className="text-slate-600 font-medium">{acct.last_warmup_email.sent_at}</span> → {acct.last_warmup_email.to_email}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tab Bar */}
            <div className="flex gap-1 bg-white p-1 rounded-xl w-fit">
                {(['overview', 'templates', 'activity'] as Tab[]).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`px-5 py-2.5 rounded-lg text-sm font-semibold capitalize transition-all ${tab === t ? 'bg-slate-50 text-orange-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        {t === 'overview' && '🔥 '}{t === 'templates' && '📝 '}{t === 'activity' && '📊 '}{t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                ))}
            </div>

            {/* ── Overview Tab ─────────────────────────────── */}
            {tab === 'overview' && (
                <div className="space-y-6">
                    {accounts.length === 0 ? (
                        <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                            <Mail size={48} className="mx-auto text-gray-300 mb-4" />
                            <h3 className="text-xl font-bold text-slate-700 mb-2">No Gmail accounts</h3>
                            <a href="/gmail" className="inline-block mt-3 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold">Connect Gmail →</a>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            {accounts.map(account => {
                                const score = account.warmup_health_score || 50;
                                const health = getHealth(score, account.warmup_enabled, account.is_connected);
                                const dailyTarget = getDailyTarget(account.warmup_day || 1);
                                const assignedTemplate = templates.find(t => t.id === account.warmup_template_id);
                                const availableTemplates = templates.filter(t => !t.gmail_account_id || t.gmail_account_id === account.id);
                                const isToggling = toggling === account.id;
                                const isAssigning = assigningTo === account.id;

                                return (
                                    <div key={account.id} className={`bg-slate-50 rounded-2xl shadow-md border-2 transition-all hover:shadow-lg ${account.warmup_enabled ? 'border-orange-200' : 'border-slate-200'}`}>
                                        {/* Card Header */}
                                        <div className={`p-5 rounded-t-2xl ${account.warmup_enabled ? 'bg-gradient-to-r from-orange-50 to-amber-50' : 'bg-white'}`}>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${account.is_connected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                        {account.name ? (
                                                            <div>
                                                                <span className="font-bold text-slate-900 text-sm">{account.name}</span>
                                                                <span className="block text-xs text-slate-400 font-normal leading-tight">{account.email}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="font-bold text-slate-900 text-sm">{account.email}</span>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-2 flex-wrap">
                                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${health.bg}`}>{health.label}</span>
                                                        <span className="text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full capitalize">{account.auth_method}</span>
                                                        {account.warmup_enabled === 1 && (
                                                            <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full animate-pulse">🔥 WARMING</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-extrabold text-slate-900">{score}%</p>
                                                    <p className="text-xs text-slate-500">Health</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card Body */}
                                        <div className="p-5 space-y-4">
                                            {/* Health Bar */}
                                            <div>
                                                <div className="flex justify-between text-xs text-slate-500 mb-1">
                                                    <span className="flex items-center gap-1"><Shield size={11} /> Inbox Health</span>
                                                    <span className="font-medium">Day {account.warmup_day || 1} · Target {dailyTarget}/day</span>
                                                </div>
                                                <div className="w-full bg-white rounded-full h-2.5">
                                                    <div className={`h-2.5 rounded-full ${health.bar} transition-all duration-700`} style={{ width: `${score}%` }} />
                                                </div>
                                            </div>

                                            {/* Warmup Stats */}
                                            {account.warmup_enabled === 1 && (
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div className="text-center bg-orange-50 rounded-lg p-2">
                                                        <p className="font-extrabold text-orange-700">{account.warmup_day || 1}</p>
                                                        <p className="text-[10px] text-slate-500">Day</p>
                                                    </div>
                                                    <div className="text-center bg-indigo-50 rounded-lg p-2">
                                                        <p className="font-extrabold text-indigo-700">{account.warmup_sent_today || 0}</p>
                                                        <p className="text-[10px] text-slate-500">Sent Today</p>
                                                    </div>
                                                    <div className="text-center bg-emerald-50 rounded-lg p-2">
                                                        <p className="font-extrabold text-emerald-700">{dailyTarget}</p>
                                                        <p className="text-[10px] text-slate-500">Target</p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Template Assignment */}
                                            <div className="bg-white rounded-xl p-3">
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-xs font-bold text-slate-700 flex items-center gap-1">
                                                        <FileText size={12} /> Assigned Template
                                                    </p>
                                                    <button onClick={() => { setTab('templates'); setTemplateMode('create'); }}
                                                        className="text-[10px] text-indigo-600 hover:text-indigo-700 font-semibold">+ New</button>
                                                </div>
                                                {isAssigning ? (
                                                    <div className="flex items-center gap-2 text-xs text-slate-500"><Loader2 size={12} className="animate-spin" /> Assigning...</div>
                                                ) : (
                                                    <select
                                                        value={account.warmup_template_id ?? ''}
                                                        onChange={e => assignTemplate(account.id, e.target.value ? parseInt(e.target.value) : null)}
                                                        className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-orange-300 outline-none"
                                                    >
                                                        <option value="">⚪ No template assigned</option>
                                                        {availableTemplates.map(t => (
                                                            <option key={t.id} value={t.id}>
                                                                {t.gmail_account_id ? '🔒' : '🌐'} {t.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}
                                                {assignedTemplate && (
                                                    <p className="text-[10px] text-slate-500 mt-1 mb-3">
                                                        {assignedTemplate.followup1_body ? '✓ Has Follow-up 1' : ''} {assignedTemplate.followup2_body ? '✓ Has Follow-up 2' : ''}
                                                    </p>
                                                )}

                                                <div className="border-t border-slate-200 mt-3 pt-3 flex items-center justify-between">
                                                    <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                                                        <Users size={12} /> Contact List
                                                    </span>
                                                    <button onClick={() => setManagingContactsId(account.id)} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-md transition-colors">
                                                        Manage Targets
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Campaign Send Limit */}
                                            <div className="flex justify-between text-xs text-slate-500">
                                                <span className="flex items-center gap-1"><Clock size={11} /> Cold Campaign: <strong className="text-slate-700 ml-1">{account.sent_today}/{account.daily_limit}</strong></span>
                                            </div>

                                            {/* Sending Time Window */}
                                            <SendingWindowEditor
                                                account={account}
                                                onSave={(start, end) => saveSendingWindow(account.id, start, end)}
                                            />

                                            {/* Toggle */}
                                            <button
                                                onClick={() => toggleWarmup(account)}
                                                disabled={isToggling || !account.is_connected}
                                                className={`w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${account.warmup_enabled
                                                    ? 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                                                    : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md shadow-orange-200'
                                                    }`}
                                            >
                                                {isToggling ? <Loader2 size={15} className="animate-spin" /> : account.warmup_enabled ? <ZapOff size={15} /> : <Zap size={15} />}
                                                {isToggling ? 'Updating...' : account.warmup_enabled ? 'Pause Warmup' : 'Enable Warmup'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Warmup Schedule Table */}
                    {warmingCount > 0 && (
                        <div className="bg-slate-50 rounded-2xl shadow-md border border-slate-200 p-6">
                            <h2 className="text-lg font-bold text-slate-900 mb-4">📅 Volume Scaling Schedule</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-white text-left">
                                            <th className="px-4 py-2.5 font-bold text-slate-700 rounded-l-xl">Days</th>
                                            <th className="px-4 py-2.5 font-bold text-slate-700">Volume</th>
                                            <th className="px-4 py-2.5 font-bold text-slate-700">Phase</th>
                                            <th className="px-4 py-2.5 font-bold text-slate-700 rounded-r-xl">Benefit</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {[
                                            ['1–7', '5/day', '🌱 Seed', 'Build account trust'],
                                            ['8–14', '10/day', '📈 Growth', 'Inbox placement improving'],
                                            ['15–21', '15/day', '🔥 Active', 'Stronger domain reputation'],
                                            ['22–28', '20/day', '⚡ Established', 'High deliverability'],
                                            ['29–35', '25/day', '🚀 Peak', 'Near-optimal health'],
                                            ['36+', '40/day', '✅ Mature', 'Maximum inbox placement'],
                                        ].map(([days, vol, phase, benefit], i) => (
                                            <tr key={i} className="hover:bg-white">
                                                <td className="px-4 py-2.5 font-semibold">{days}</td>
                                                <td className="px-4 py-2.5 text-indigo-700 font-medium">{vol}</td>
                                                <td className="px-4 py-2.5">{phase}</td>
                                                <td className="px-4 py-2.5 text-slate-500">{benefit}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── Templates Tab ─────────────────────────────── */}
            {tab === 'templates' && (
                <div className="space-y-5">
                    {templateMode === 'list' && (
                        <>
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-slate-900">Warm-Up Templates</h2>
                                <button onClick={() => { setTemplateMode('create'); setEditingTemplate(null); }}
                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold text-sm shadow-md hover:from-orange-600 hover:to-amber-600">
                                    <Plus size={16} /> New Template
                                </button>
                            </div>

                            {templates.length === 0 ? (
                                <div className="text-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                    <FileText size={40} className="mx-auto text-gray-300 mb-3" />
                                    <h3 className="font-bold text-slate-700 mb-1">No warmup templates yet</h3>
                                    <p className="text-slate-500 text-sm mb-4">Create your first template or use AI suggestions</p>
                                    <button onClick={() => setTemplateMode('create')}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-xl font-semibold text-sm">
                                        <Plus size={16} /> Create Template
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {templates.map(t => {
                                        const assignedAccount = accounts.find(a => a.id === t.gmail_account_id);
                                        const usedBy = accounts.filter(a => a.warmup_template_id === t.id);
                                        return (
                                            <div key={t.id} className="bg-slate-50 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <h3 className="font-bold text-slate-900">{t.name}</h3>
                                                        <div className="flex gap-2 mt-1">
                                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.gmail_account_id ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-slate-600'}`}>
                                                                {t.gmail_account_id ? `🔒 ${assignedAccount?.email || 'Account #' + t.gmail_account_id}` : '🌐 Global'}
                                                            </span>
                                                            {t.followup1_body && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">+FU1</span>}
                                                            {t.followup2_body && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">+FU2</span>}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <button onClick={() => { setEditingTemplate(t); setTemplateMode('edit'); }}
                                                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 size={15} /></button>
                                                        <button onClick={() => deleteTemplate(t.id)}
                                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={15} /></button>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-slate-600 font-semibold">Subject: <span className="font-normal">{t.subject}</span></p>
                                                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{t.body}</p>
                                                {usedBy.length > 0 && (
                                                    <div className="mt-3 flex flex-wrap gap-1">
                                                        {usedBy.map(a => (
                                                            <span key={a.id} className="text-[10px] bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full">
                                                                ⚡ {a.email.split('@')[0]}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}

                    {(templateMode === 'create' || templateMode === 'edit') && (
                        <TemplateEditor
                            accounts={accounts}
                            initialData={editingTemplate ? (editingTemplate as any) : undefined}
                            onSave={() => { setTemplateMode('list'); setEditingTemplate(null); loadAll(); }}
                            onCancel={() => { setTemplateMode('list'); setEditingTemplate(null); }}
                        />
                    )}
                </div>
            )}

            {/* ── Activity Tab ─────────────────────────────── */}
            {tab === 'activity' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Warm-Up Activity Log</h2>
                            <p className="text-sm text-slate-400 mt-0.5">{logs.length} events recorded across all inboxes</p>
                        </div>
                        <button onClick={loadAll} className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-xl hover:bg-slate-100 border border-slate-200 transition-colors">
                            <RotateCcw size={15} /> Refresh
                        </button>
                    </div>

                    {/* Per-account summary stats */}
                    {accounts.some(a => a.warmup_enabled) && (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                                <BarChart3 size={16} className="text-orange-500" />
                                <h3 className="font-bold text-slate-900 text-sm">Per-Inbox Warmup Stats</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-100">
                                        <tr>
                                            {['Inbox', 'Status', 'Day', 'Health', 'Sent Today', 'Total Warmup Sent', 'Last Sent'].map(h => (
                                                <th key={h} className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-xs">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {accounts.filter(a => a.warmup_enabled || a.warmup_sent_today > 0).map(a => {
                                            const score = a.warmup_health_score || 0;
                                            const health = getHealth(score, a.warmup_enabled, a.is_connected);
                                            // Find the latest log for this account
                                            const lastLog = logs.find(l => l.gmail_account_id === a.id);
                                            const lastSentMs = lastLog ? (lastLog.timestamp > 1e10 ? lastLog.timestamp : lastLog.timestamp * 1000) : null;
                                            const timeAgoStr = lastSentMs ? (() => {
                                                const diff = Date.now() - lastSentMs;
                                                const mins = Math.floor(diff / 60000);
                                                if (mins < 1) return 'just now';
                                                if (mins < 60) return `${mins}m ago`;
                                                const hrs = Math.floor(mins / 60);
                                                if (hrs < 24) return `${hrs}h ago`;
                                                return `${Math.floor(hrs / 24)}d ago`;
                                            })() : '—';
                                            return (
                                                <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <div className="font-semibold text-slate-900 text-sm">{a.email}</div>
                                                        <div className="text-xs text-slate-400">{a.auth_method}</div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${health.bg}`}>
                                                            {health.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 font-bold text-orange-600">Day {a.warmup_day || 1}</td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-1.5 w-16 bg-slate-200 rounded-full overflow-hidden">
                                                                <div className={`h-full ${health.bar}`} style={{ width: `${score}%` }} />
                                                            </div>
                                                            <span className="text-xs font-bold text-slate-600">{score}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 font-bold text-indigo-600">{a.warmup_sent_today || 0}</td>
                                                    <td className="px-4 py-3 text-slate-600">{logs.filter(l => l.gmail_account_id === a.id).length}</td>
                                                    <td className="px-4 py-3">
                                                        {lastSentMs ? (
                                                            <div>
                                                                <div className="text-xs font-semibold text-slate-700">{timeAgoStr}</div>
                                                                <div className="text-[10px] text-slate-400">
                                                                    {new Date(lastSentMs).toLocaleString('en-PK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-slate-300">Never</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Detailed event log */}
                    {logs.length === 0 ? (
                        <div className="text-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                            <Activity size={40} className="mx-auto text-gray-300 mb-3" />
                            <h3 className="font-bold text-slate-700">No warmup activity yet</h3>
                            <p className="text-sm text-slate-400 mt-1">Enable warmup on an account and click "Trigger Now" to start.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Activity size={16} className="text-orange-500" />
                                    <h3 className="font-bold text-slate-900 text-sm">Recent Events</h3>
                                </div>
                                <span className="text-xs text-slate-400">Showing last {logs.length} events</span>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {logs.map(log => {
                                    const typeColors: Record<string, string> = {
                                        warmup_send: 'bg-indigo-100 text-indigo-700 border-indigo-200',
                                        warmup_reply: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                                        warmup_open: 'bg-purple-100 text-purple-700 border-purple-200',
                                    };
                                    const typeLabel: Record<string, string> = {
                                        warmup_send: '📤 Sent',
                                        warmup_reply: '↩️ Reply',
                                        warmup_open: '👁 Open',
                                    };
                                    const tMs = log.timestamp > 1e10 ? log.timestamp : log.timestamp * 1000;
                                    const mins = Math.floor((Date.now() - tMs) / 60000);
                                    const ago = mins < 1 ? 'just now' : mins < 60 ? `${mins}m ago` : mins < 1440 ? `${Math.floor(mins / 60)}h ago` : `${Math.floor(mins / 1440)}d ago`;

                                    return (
                                        <div key={log.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 transition-colors">
                                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg whitespace-nowrap border ${typeColors[log.type] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                                {typeLabel[log.type] || log.type}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-slate-900 truncate">{log.subject || '(no subject)'}</p>
                                                <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                                                    <span className="font-medium text-slate-600">{log.account_email || log.gmail_email}</span>
                                                    {log.to_email && <span>→ {log.to_email}</span>}
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <div className="text-xs font-semibold text-slate-500">{ago}</div>
                                                <div className="text-[10px] text-slate-300 mt-0.5">
                                                    {new Date(tMs).toLocaleString('en-PK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {managingContactsId && (
                <ContactsModal accountId={managingContactsId} onClose={() => setManagingContactsId(null)} />
            )}
        </div>
    );
}

// ─── Contacts Modal ────────────────────────────────────────────────────────
function ContactsModal({ accountId, onClose }: { accountId: number; onClose: () => void }) {
    const [contacts, setContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [bulkInput, setBulkInput] = useState('');
    const [adding, setAdding] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        const res = await fetch(`/api/warmup/contacts/${accountId}`);
        if (res.ok) setContacts(await res.json());
        setLoading(false);
    }, [accountId]);

    useEffect(() => { load(); }, [load]);

    async function handleAdd() {
        if (!bulkInput.trim()) return;
        setAdding(true);
        const lines = bulkInput.split('\n');
        const toAdd = lines.map(l => {
            const [email, name] = l.split(',').map(s => s.trim());
            return { email, name: name || '' };
        }).filter(c => c.email && c.email.includes('@'));

        try {
            const res = await fetch(`/api/warmup/contacts/${accountId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contacts: toAdd })
            });
            if (res.ok) {
                setBulkInput('');
                load();
            } else {
                alert('Failed to add contacts');
            }
        } finally {
            setAdding(false);
        }
    }

    async function handleDelete(id: number) {
        if (!confirm('Remove contact?')) return;
        const res = await fetch(`/api/warmup/contacts/${accountId}?id=${id}`, { method: 'DELETE' });
        if (res.ok) load();
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-50 rounded-2xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-white">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2"><Users size={18} className="text-indigo-500" /> Dedicated Warmup Contacts</h3>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"><X size={16} /></button>
                </div>

                <div className="p-5 overflow-y-auto flex-1 space-y-5">
                    <div>
                        <p className="text-xs font-semibold text-slate-600 mb-2">Bulk Add List (CSV style)</p>
                        <textarea value={bulkInput} onChange={e => setBulkInput(e.target.value)}
                            placeholder="email@example.com, John Doe&#10;test@domain.com, Jane Smith"
                            rows={3}
                            className="w-full text-sm border border-slate-200 rounded-lg p-3 resize-none focus:ring-2 focus:ring-indigo-400 outline-none"
                        />
                        <button onClick={handleAdd} disabled={adding || !bulkInput.trim()}
                            className="mt-2 text-xs font-bold px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50">
                            {adding ? 'Importing...' : 'Import Contacts'}
                        </button>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-xs font-semibold text-slate-600">Current Warmup Targets ({contacts.length})</p>
                            {contacts.length > 0 && <span className="text-[10px] text-slate-400">Sent / Replied</span>}
                        </div>
                        {loading ? <p className="text-xs text-slate-500">Loading...</p> : contacts.length === 0 ? (
                            <div className="text-center p-5 bg-white rounded-xl border border-slate-200">
                                <p className="text-sm text-slate-500 font-medium">No dedicated contacts.</p>
                                <p className="text-xs text-slate-400 mt-1">If empty, the warmup engine will fallback to pinging other internal connected accounts.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {contacts.map(c => (
                                    <div key={c.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">{c.email}</p>
                                            <p className="text-xs text-slate-500">{c.name || 'No name'}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-slate-700">{c.sent_count} / {c.reply_count}</p>
                                                <p className="text-[10px] text-slate-400">Stats</p>
                                            </div>
                                            <button onClick={() => handleDelete(c.id)} className="text-rose-400 hover:text-rose-600 p-1.5 bg-rose-50 hover:bg-rose-100 rounded-md">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
