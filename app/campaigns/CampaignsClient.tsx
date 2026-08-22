'use client';

import { useState, useRef } from 'react';
import useSWR, { mutate } from 'swr';
import {
    Play, Pause, Loader2, Plus, Edit, Trash, FileText, CheckSquare,
    Upload, X, Mail, CheckCircle, Sparkles, TrendingUp, TestTube,
    Clock, BarChart2, RefreshCw, Eye, MessageSquare, AlertCircle,
    ChevronDown, ChevronUp, Send, User, Calendar, Activity, Zap, Timer, GitBranch
} from 'lucide-react';
import RichTextEditor from '@/components/RichTextEditor';
import { motion, AnimatePresence } from 'framer-motion';
import TestingCenterClient from '../test/TestingCenterClient';

// Global SWR Fetcher
const fetcher = (url: string) => fetch(url).then(r => r.json());

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
        pending: 'bg-slate-100 dark:bg-zinc-800/50 text-slate-600 dark:text-zinc-400',
        bounced: 'bg-rose-100 text-rose-700',
        replied: 'bg-emerald-100 text-emerald-700',
        unsubscribed: 'bg-orange-100 text-orange-700',
        opened: 'bg-amber-100 text-amber-700',
    };
    return (
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${map[status] || 'bg-slate-100 dark:bg-zinc-800/50 text-slate-500 dark:text-zinc-400'}`}>
            {status}
        </span>
    );
}

// ─── Campaign Logs Panel ─────────────────────────────────────────────────────

function CampaignLogsPanel({ campaign, onClose }: { campaign: any; onClose: () => void }) {
    const [filter, setFilter] = useState<string>('all');
    const [aiLoading, setAiLoading] = useState(false);
    const [aiMessage, setAiMessage] = useState<string | null>(null);

    const { data, error, isLoading: loading, mutate: mutateLogs } = useSWR(`/api/campaigns/${campaign.id}/logs`, fetcher, {
        refreshInterval: 5000 // auto refresh campaign logs while open
    });

    const leads = data?.leads || [];
    const stats = data?.stats || {};
    const filtered = filter === 'all' ? leads : leads.filter((l: any) => l.status === filter);

    async function handleAiPersonalize() {
        setAiLoading(true);
        setAiMessage(null);
        try {
            const res = await fetch('/api/ai/personalize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ campaignId: campaign.id })
            });
            const json = await res.json();
            if (json.success) {
                setAiMessage(`✨ Gemini AI successfully personalized ${json.successCount || json.processed || 1} leads for this campaign!`);
                mutateLogs();
            } else {
                setAiMessage(`Error: ${json.error || 'Failed to personalize leads'}`);
            }
        } catch (err: any) {
            setAiMessage(`Error: ${err.message}`);
        } finally {
            setAiLoading(false);
        }
    }

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
                className="w-full max-w-3xl h-screen bg-white dark:bg-zinc-900/60 shadow-2xl flex flex-col"
            >
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-zinc-50 tracking-tight">{campaign.name}</h2>
                            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">Send log & delivery status</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                            <X size={20} className="text-slate-600 dark:text-zinc-400" />
                        </button>
                    </div>

                    {/* Stats row */}
                    {!loading && (
                        <div className="grid grid-cols-5 gap-3">
                            {[
                                { label: 'Total', value: stats.total ?? 0, icon: <User size={14} />, color: 'text-slate-600 dark:text-zinc-400' },
                                { label: 'Sent', value: stats.sent ?? 0, icon: <Send size={14} />, color: 'text-indigo-600' },
                                { label: 'Opened', value: stats.opened ?? 0, icon: <Eye size={14} />, color: 'text-amber-600' },
                                { label: 'Replied', value: stats.replied ?? 0, icon: <MessageSquare size={14} />, color: 'text-emerald-600' },
                                { label: 'Bounced', value: stats.bounced ?? 0, icon: <AlertCircle size={14} />, color: 'text-rose-600' },
                            ].map(s => (
                                <div key={s.label} className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 text-center">
                                    <div className={`flex items-center justify-center gap-1 ${s.color} mb-1`}>{s.icon}</div>
                                    <div className="text-xl font-black text-slate-900 dark:text-zinc-50">{s.value}</div>
                                    <div className="text-xs text-slate-400 font-semibold">{s.label}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Filter bar & AI button */}
                <div className="px-8 py-3 border-b border-slate-100 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-zinc-900/60">
                    <div className="flex items-center gap-2">
                        {['all', 'pending', 'sent', 'opened', 'replied', 'bounced'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${filter === f ? 'bg-indigo-600 text-white' : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:bg-zinc-800/50'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleAiPersonalize}
                        disabled={aiLoading}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md hover:shadow-indigo-500/20 active:scale-95 disabled:opacity-50"
                    >
                        <Sparkles size={14} className={aiLoading ? 'animate-spin' : 'text-amber-300'} />
                        {aiLoading ? 'Personalizing with Gemini AI...' : 'Personalize Leads with Gemini AI'}
                    </button>
                </div>

                {aiMessage && (
                    <div className={`px-8 py-2 text-xs font-semibold ${aiMessage.startsWith('✨') ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-rose-50 text-rose-700'}`}>
                        {aiMessage}
                    </div>
                )}

                {/* Leads list */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 size={32} className="animate-spin text-indigo-400" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-20">
                            <Mail size={40} className="text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 dark:text-zinc-400 font-medium">No leads match this filter.</p>
                            {stats.total === 0 && (
                                <p className="text-slate-400 text-sm mt-2">Upload a CSV to add leads to this campaign.</p>
                            )}
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {filtered.map((lead: any) => (
                                <div key={lead.id} className="px-8 py-4 hover:bg-slate-50 dark:bg-zinc-900/50 transition-colors">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-semibold text-slate-900 dark:text-zinc-50 text-sm truncate">
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
                                                    <div className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 flex items-center gap-1 justify-end">
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
                                                <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-300 shrink-0"></span>
                                                    Follow-up 1 sent · {formatTs(lead.followup1_sent_at)}
                                                </div>
                                            )}
                                            {lead.followup2_sent_at && (
                                                <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
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
    
    // SWR Cache hooks
    const { data: campaigns = [], isLoading: loadingCampaigns } = useSWR('/api/campaigns', fetcher);
    const { data: templates = [], isLoading: loadingTemplates } = useSWR('/api/templates', fetcher);
    const { data: accounts = [], isLoading: loadingAccounts } = useSWR('/api/gmail/accounts', fetcher);
    const loading = loadingCampaigns || loadingTemplates || loadingAccounts;

    const [activeLogs, setActiveLogs] = useState<any>(null); // campaign whose logs to show
    const [refreshing, setRefreshing] = useState<number | null>(null);
    const [sending, setSending] = useState<number | null>(null); // campaign id being manually sent
    const isSendingRef = useRef(false); // prevents double-send on rapid double-click
    const [sendNowCampaign, setSendNowCampaign] = useState<any>(null);
    const [sendNowDelay, setSendNowDelay] = useState<number>(10);
    const [uploadResult, setUploadResult] = useState<{ added: number; total: number } | null>(null);

    // Bulk Campaign Selection States
    const [selectedCampaignIds, setSelectedCampaignIds] = useState<number[]>([]);

    // Bulk Uploader Modal States
    const [isBulkAssignOpen, setIsBulkAssignOpen] = useState(false);
    const [bulkFiles, setBulkFiles] = useState<FileList | null>(null);
    const [bulkTemplateId, setBulkTemplateId] = useState<string>('random');
    const [bulkFileTemplates, setBulkFileTemplates] = useState<Record<string, string>>({});
    const [bulkStatus, setBulkStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [bulkMessage, setBulkMessage] = useState('');
    const [bulkResults, setBulkResults] = useState<any[]>([]);
    const [rotateTemplateId1, setRotateTemplateId1] = useState<string>('');
    const [rotateTemplateId2, setRotateTemplateId2] = useState<string>('');
    const [rotateTemplateId3, setRotateTemplateId3] = useState<string>('');
    const [isBulkSendOpen, setIsBulkSendOpen] = useState(false);
    const [bulkSendProgress, setBulkSendProgress] = useState<{ current: number; total: number; sending: boolean; errors: string[] } | null>(null);

    const toggleSelectCampaign = (id: number) => {
        setSelectedCampaignIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const toggleSelectAllCampaigns = () => {
        if (selectedCampaignIds.length === campaigns.length) {
            setSelectedCampaignIds([]);
        } else {
            setSelectedCampaignIds(campaigns.map((c: any) => c.id));
        }
    };

    async function handleBulkDelete() {
        if (selectedCampaignIds.length === 0) return;
        if (!confirm(`Are you sure you want to delete the ${selectedCampaignIds.length} selected campaigns and all their leads?`)) return;
        
        try {
            const res = await fetch('/api/campaigns/bulk-delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedCampaignIds })
            });
            const data = await res.json();
            if (data.success) {
                alert(`Successfully deleted ${data.count} campaigns.`);
                setSelectedCampaignIds([]);
                mutate('/api/campaigns');
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (err: any) {
            alert(`Failed to delete: ${err.message}`);
        }
    }

    async function handleBulkStatus(status: 'running' | 'paused') {
        if (selectedCampaignIds.length === 0) return;
        if (!confirm(`Are you sure you want to set the ${selectedCampaignIds.length} selected campaigns to ${status}?`)) return;
        
        try {
            const res = await fetch('/api/campaigns/bulk-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedCampaignIds, status })
            });
            const data = await res.json();
            if (data.success) {
                alert(`Successfully updated ${data.count} campaigns to ${status}.`);
                setSelectedCampaignIds([]);
                mutate('/api/campaigns');
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (err: any) {
            alert(`Failed to update: ${err.message}`);
        }
    }

    async function handleAllStatus(status: 'running' | 'paused') {
        if (campaigns.length === 0) return;
        if (!confirm(`Are you sure you want to set ALL ${campaigns.length} campaigns to ${status}?`)) return;

        const ids = campaigns.map((c: any) => c.id);
        
        try {
            const res = await fetch('/api/campaigns/bulk-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids, status })
            });
            const data = await res.json();
            if (data.success) {
                alert(`Successfully set all ${data.count} campaigns to ${status}.`);
                setSelectedCampaignIds([]);
                mutate('/api/campaigns');
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (err: any) {
            alert(`Failed to update: ${err.message}`);
        }
    }

    async function confirmBulkSend() {
        if (selectedCampaignIds.length === 0) return;
        setIsBulkSendOpen(false);
        
        const total = selectedCampaignIds.length;
        let successCount = 0;
        let failCount = 0;
        const errors: string[] = [];

        // Show progress overlay
        setBulkSendProgress({ current: 0, total, sending: true, errors: [] });
        
        for (let i = 0; i < selectedCampaignIds.length; i++) {
            const campaignId = selectedCampaignIds[i];
            setBulkSendProgress(prev => prev ? { ...prev, current: i + 1 } : null);
            try {
                const campaign = campaigns.find((c: any) => c.id === campaignId);
                const res = await fetch(`/api/campaigns/${campaignId}/send`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ delaySeconds: sendNowDelay })
                });
                const json = await res.json();
                if (json.success) {
                    if (campaign && campaign.status !== 'running') {
                        await fetch(`/api/campaigns/${campaignId}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: 'running' })
                        });
                    }
                    successCount++;
                } else {
                    failCount++;
                    const campName = campaigns.find((c: any) => c.id === campaignId)?.name || `Campaign #${campaignId}`;
                    errors.push(`${campName}: ${json.error || 'Unknown error'}`);
                }
            } catch (e: any) {
                failCount++;
                errors.push(`Campaign #${campaignId}: Network error`);
            }
        }
        
        setBulkSendProgress({ current: total, total, sending: false, errors });
        setSelectedCampaignIds([]);
        mutate('/api/campaigns');
    }

    async function handleBulkAssign() {
        if (!bulkFiles || bulkFiles.length === 0) {
            setBulkMessage('Please select one or more CSV files.');
            setBulkStatus('error');
            return;
        }

        const isRandomThreeUsed = bulkTemplateId === 'random_three';
        if (isRandomThreeUsed && (!rotateTemplateId1 || !rotateTemplateId2 || !rotateTemplateId3)) {
            setBulkMessage('Please select all 3 templates (A, B, and C) for the rotation option.');
            setBulkStatus('error');
            return;
        }

        setBulkStatus('loading');
        setBulkMessage('Creating campaigns and importing leads...');
        setBulkResults([]);

        try {
            const data = new FormData();
            for (let i = 0; i < bulkFiles.length; i++) {
                data.append('files', bulkFiles[i]);
            }
            
            data.append('template_id', bulkTemplateId);
            data.append('rotate_template_ids', JSON.stringify([rotateTemplateId1, rotateTemplateId2, rotateTemplateId3]));
            data.append('type', 'client'); // default to client Outreach

            // Send per-file template overrides so each sheet uses its own template
            if (Object.keys(bulkFileTemplates).length > 0) {
                data.append('file_templates', JSON.stringify(bulkFileTemplates));
            }

            const res = await fetch('/api/campaigns/bulk-assign', {
                method: 'POST',
                body: data
            });

            const json = await res.json();
            if (!res.ok) {
                throw new Error(json.error || 'Failed to auto-assign sheets');
            }

            setBulkStatus('success');
            setBulkMessage('🎉 Bulk auto-assign completed successfully!');
            setBulkResults(json.results || []);
            setBulkFiles(null);
            setBulkFileTemplates({});
            setRotateTemplateId1('');
            setRotateTemplateId2('');
            setRotateTemplateId3('');
            mutate('/api/campaigns');
        } catch (e: any) {
            setBulkStatus('error');
            setBulkMessage(`Error: ${e.message}`);
        }
    }

    // Form States
    const [editingCampaign, setEditingCampaign] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '', template_id: '', template_id_b: '',
        account_ids: [] as number[],
        send_start: '08:00', send_end: '18:00',
        followup1_delay_hours: 48, followup2_delay_hours: 96,
        followup1_template_id: '', followup2_template_id: '',
        followup_enabled: true,
        ai_personalize_enabled: true,
        ai_custom_prompt: '',
    });
    const [file, setFile] = useState<File | null>(null);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
    const [saveMessage, setSaveMessage] = useState('');

    // Template Form
    const [editingTemplate, setEditingTemplate] = useState<any>(null);
    const [templateData, setTemplateData] = useState({ name: '', subject: '', body: '' });

    async function refreshCampaign(id: number) {
        setRefreshing(id);
        await mutate('/api/campaigns');
        setRefreshing(null);
    }

    async function handleSaveCampaign() {
        if (!formData.name) { setSaveMessage('Campaign name is required'); setSaveStatus('error'); return; }
        if (!formData.template_id && !formData.ai_personalize_enabled) { setSaveMessage('Please select an email template or enable Gemini AI Personalization'); setSaveStatus('error'); return; }
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

                // Auto-trigger Gemini AI Personalization if enabled
                if (formData.ai_personalize_enabled) {
                    setSaveMessage(`✨ Gemini AI is generating personalized hooks for your ${uploadJson.added} leads...`);
                    try {
                        await fetch('/api/ai/personalize', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ campaignId, customPrompt: formData.ai_custom_prompt })
                        });
                        setSaveMessage(`✨ Gemini AI successfully personalized leads! Campaign ready.`);
                    } catch (aiErr) {
                        console.error('AI Personalization trigger error:', aiErr);
                    }
                }

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
            const blankForm = { name: '', template_id: '', template_id_b: '', account_ids: [], send_start: '08:00', send_end: '18:00', followup1_delay_hours: 48, followup2_delay_hours: 96, followup1_template_id: '', followup2_template_id: '', followup_enabled: true, ai_personalize_enabled: true, ai_custom_prompt: '' };
            setFormData(blankForm);
            mutate('/api/campaigns');
        } catch (e: any) {
            setSaveStatus('error');
            setSaveMessage(`Error: ${e.message}`);
        }
    }

    async function deleteCampaign(id: number) {
        if (!confirm('Delete this campaign and all its leads?')) return;
        await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
        mutate('/api/campaigns');
    }

    async function toggleCampaignStatus(c: any) {
        const newStatus = c.status === 'running' ? 'paused' : 'running';
        // Optimistic UI update
        mutate('/api/campaigns', campaigns.map((camp: any) => camp.id === c.id ? { ...camp, status: newStatus } : camp), false);
        await fetch(`/api/campaigns/${c.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        mutate('/api/campaigns');
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
            mutate('/api/templates');
        } catch (e) { alert('Failed to save template'); }
    }

    async function confirmManualSend() {
        if (!sendNowCampaign) return;
        // Hard lock: prevent double-send from rapid clicks or React StrictMode double-invoke
        if (isSendingRef.current) return;
        isSendingRef.current = true;

        const campaign = sendNowCampaign;
        const delaySeconds = sendNowDelay;
        setSendNowCampaign(null);
        setSending(campaign.id);
        try {
            const res = await fetch(`/api/campaigns/${campaign.id}/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ delaySeconds })
            });
            const json = await res.json();
            if (json.success) {
                // Auto-activate the campaign so the cron continues sending remaining leads
                if (campaign.status !== 'running') {
                    await fetch(`/api/campaigns/${campaign.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'running' })
                    });
                }
                alert(`✅ ${json.message}\n\nCounts: ${json.counts?.sent || 0} sent, ${json.counts?.pending || 0} pending\n\nCampaign is now Running — remaining leads will send automatically.`);
                mutate('/api/campaigns');
            } else {
                alert(`❌ Error: ${json.error}`);
            }
        } catch (e: any) {
            alert(`❌ Network error: ${e.message}`);
        } finally {
            setSending(null);
            isSendingRef.current = false;
        }
    }

    async function deleteTemplate(id: number) {
        if (!confirm('Delete this template?')) return;
        await fetch(`/api/templates/${id}`, { method: 'DELETE' });
        mutate('/api/templates');
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
                <div className="flex justify-between items-center bg-white dark:bg-zinc-900/60 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-zinc-50 tracking-tight">Testing Center</h1>
                        <p className="text-slate-500 dark:text-zinc-400 mt-1">Verify emails and test templates safely</p>
                    </div>
                    <button onClick={() => setView('list')} className="text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:text-zinc-50 font-semibold px-4 py-2 hover:bg-slate-100 dark:bg-zinc-800/50 rounded-xl transition-colors">
                        ← Back
                    </button>
                </div>
                <div className="bg-white dark:bg-zinc-900/60 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800">
                    <TestingCenterClient />
                </div>
            </div>
        );
    }

    // ── Templates view ────────────────────────────────────────────────────────
    if (view === 'templates') {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center bg-white dark:bg-zinc-900/60 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-zinc-50 tracking-tight">Email Templates</h1>
                        <p className="text-slate-500 dark:text-zinc-400 mt-1">Create and manage reusable email sequences</p>
                    </div>
                    <button onClick={() => setView('list')} className="text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:text-zinc-50 font-semibold px-4 py-2 hover:bg-slate-100 dark:bg-zinc-800/50 rounded-xl transition-colors">
                        ← Back
                    </button>
                </div>

                <div className="bg-white dark:bg-zinc-900/60 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800">
                    <h2 className="text-lg font-bold mb-5 text-slate-900 dark:text-zinc-50">{editingTemplate ? 'Edit Template' : 'New Template'}</h2>
                    <div className="space-y-4">
                        <input placeholder="Template Name" className="w-full p-3 border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 text-slate-900 dark:text-zinc-50 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" value={templateData.name} onChange={e => setTemplateData({ ...templateData, name: e.target.value })} />
                        <input placeholder="Email Subject" className="w-full p-3 border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 text-slate-900 dark:text-zinc-50 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" value={templateData.subject} onChange={e => setTemplateData({ ...templateData, subject: e.target.value })} />
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
                            {editingTemplate && <button onClick={() => { setEditingTemplate(null); setTemplateData({ name: '', subject: '', body: '' }); }} className="bg-slate-100 dark:bg-zinc-800/50 text-slate-700 dark:text-zinc-300 px-6 py-2.5 rounded-xl hover:bg-slate-200 font-semibold transition-colors">Cancel</button>}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map((t: any) => (
                        <div key={t.id} className="bg-white dark:bg-zinc-900/60 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm hover:border-indigo-200 transition-all">
                            <h3 className="font-bold text-slate-900 dark:text-zinc-50">{t.name}</h3>
                            <p className="text-sm text-slate-500 dark:text-zinc-400 truncate mt-1">{t.subject}</p>
                            <div className="mt-4 flex gap-2">
                                <button onClick={() => { setEditingTemplate(t); setTemplateData(t); }} className="p-2 text-slate-500 dark:text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit size={16} /></button>
                                <button onClick={() => deleteTemplate(t.id)} className="p-2 text-slate-500 dark:text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash size={16} /></button>
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
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto bg-white dark:bg-zinc-900/60 p-10 rounded-3xl shadow-sm border border-slate-200 dark:border-zinc-800 space-y-8">
                <div className="flex justify-between items-center pb-6 border-b border-slate-200 dark:border-zinc-800">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-zinc-50 tracking-tight">{editingCampaign ? 'Edit Campaign' : 'New Campaign'}</h1>
                        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">Configure your email outreach settings</p>
                    </div>
                    <button onClick={() => setView('list')} className="text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:text-zinc-50 flex items-center gap-2 p-2 hover:bg-slate-100 dark:bg-zinc-800/50 rounded-xl transition-colors">
                        <X size={20} /> <span className="font-medium">Cancel</span>
                    </button>
                </div>

                <div className="space-y-6">
                    <div className="bg-slate-50 dark:bg-zinc-900/50 p-5 rounded-xl border border-slate-200 dark:border-zinc-800">
                        <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-zinc-300">Campaign Name *</label>
                        <input className="w-full p-3 bg-white dark:bg-zinc-900/60 border border-slate-300 text-slate-900 dark:text-zinc-50 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-400" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Q1 Agency Outreach" />
                    </div>

                    <div className="bg-slate-50 dark:bg-zinc-900/50 p-5 rounded-xl border border-slate-200 dark:border-zinc-800">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-2">
                                <FileText size={16} className="text-indigo-500" />
                                Email Template {formData.ai_personalize_enabled ? <span className="text-xs text-indigo-600 font-normal">(Optional — Gemini AI Active)</span> : '*'}
                            </label>
                            {formData.ai_personalize_enabled && (
                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                                    <Sparkles size={12} /> Auto-Generated by Gemini AI
                                </span>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <select
                                className={`flex-1 p-3 bg-white dark:bg-zinc-900/60 border border-slate-300 text-slate-900 dark:text-zinc-50 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none ${formData.ai_personalize_enabled ? 'opacity-75' : ''}`}
                                value={formData.template_id}
                                onChange={e => setFormData({ ...formData, template_id: e.target.value })}
                            >
                                <option value="">{formData.ai_personalize_enabled ? '-- Auto-Generated by Gemini AI Engine --' : '-- Select Template A --'}</option>
                                {templates.map((t: any) => <option key={t.id} value={t.id}>{t.name} · {t.subject}</option>)}
                            </select>
                            <button onClick={() => setView('templates')} className="px-5 py-3 bg-slate-100 dark:bg-zinc-800/50 text-slate-800 dark:text-zinc-200 rounded-xl hover:bg-slate-200 flex items-center gap-2 whitespace-nowrap font-medium border border-slate-300 transition-colors">
                                <Plus size={18} /> New
                            </button>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-zinc-800">
                            <label className="block text-xs font-semibold mb-2 text-slate-500 dark:text-zinc-400 flex items-center gap-2"> A/B Split Test (Optional Template B)</label>
                            <select className="w-full p-3 bg-white dark:bg-zinc-900/60 border border-slate-300 text-slate-900 dark:text-zinc-50 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.template_id_b} onChange={e => setFormData({ ...formData, template_id_b: e.target.value })}>
                                <option value="">-- Pick Template B (Optional) --</option>
                                {templates.map((t: any) => <option key={t.id} value={t.id}>{t.name} · {t.subject}</option>)}
                            </select>
                            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1.5">If selected, the system will randomly 50/50 split the leads between Template A and B.</p>
                        </div>
                    </div>

                    {/* Gemini AI Lead Personalization Box */}
                    <div className="bg-gradient-to-r from-indigo-50/80 to-blue-50/80 dark:from-indigo-950/40 dark:to-blue-950/40 p-6 rounded-2xl border border-indigo-200/80 dark:border-indigo-800/60 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-base font-extrabold text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
                                <Sparkles size={20} className="text-amber-500 fill-amber-400" />
                                Gemini AI Lead Personalization Engine
                            </label>
                            <label className="flex items-center gap-2.5 cursor-pointer bg-white dark:bg-zinc-900 px-3.5 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 shadow-sm">
                                <span className="text-xs font-extrabold text-indigo-700 dark:text-indigo-300">Enable Gemini AI Personalization</span>
                                <input
                                    type="checkbox"
                                    checked={formData.ai_personalize_enabled}
                                    onChange={e => setFormData({ ...formData, ai_personalize_enabled: e.target.checked })}
                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                                />
                            </label>
                        </div>
                        <p className="text-xs text-indigo-800/80 dark:text-indigo-300/80 leading-relaxed font-medium">
                            ✨ When enabled, Google Gemini AI will inspect every uploaded lead's company, role, website, and industry to craft tailored icebreakers & personalized email variations for maximum reply rates.
                        </p>
                        {formData.ai_personalize_enabled && (
                            <div className="pt-2">
                                <label className="text-xs font-bold text-indigo-950 dark:text-indigo-200 block mb-1.5">Custom AI Prompt Instructions (Optional)</label>
                                <input
                                    className="w-full p-3 bg-white dark:bg-zinc-900 border border-indigo-200 dark:border-indigo-800/80 rounded-xl text-xs text-slate-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
                                    placeholder="e.g. Focus on ROI, mention our 14-day free trial, and keep line under 40 words"
                                    value={formData.ai_custom_prompt || ''}
                                    onChange={e => setFormData({ ...formData, ai_custom_prompt: e.target.value })}
                                />
                            </div>
                        )}
                    </div>

                    <div className="bg-slate-50 dark:bg-zinc-900/50 p-5 rounded-xl border border-slate-200 dark:border-zinc-800">
                        <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-zinc-300 flex items-center gap-2"><Mail size={16} className="text-emerald-500" /> Sending Accounts *</label>
                        <p className="text-xs text-slate-400 mb-3">Select one or more accounts for this campaign.</p>
                        <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 rounded-xl p-2 space-y-1">
                            {accounts.length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-6">No Gmail accounts connected. <a href="/gmail" className="text-indigo-600 hover:underline">Add one</a></p>
                            ) : accounts.map((acc: any) => (
                                <label key={acc.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:bg-zinc-900/50 rounded-lg cursor-pointer transition-colors">
                                    <input type="checkbox" checked={formData.account_ids.includes(acc.id)} onChange={e => {
                                        if (e.target.checked) setFormData({ ...formData, account_ids: [...formData.account_ids, acc.id] });
                                        else setFormData({ ...formData, account_ids: formData.account_ids.filter(id => id !== acc.id) });
                                    }} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                                    <div className="flex-1">
                                        <span className="text-sm font-medium text-slate-800 dark:text-zinc-200">{acc.email}</span>
                                        <span className="text-xs text-slate-400 ml-2">({acc.sent_today}/{acc.daily_limit} today)</span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-zinc-900/50 p-5 rounded-xl border border-slate-200 dark:border-zinc-800">
                        <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-zinc-300 flex items-center gap-2"><Timer size={16} className="text-amber-500" /> Upload Leads (CSV)</label>
                        <input type="file" accept=".csv" onChange={e => setFile(e.target.files?.[0] || null)} className="block w-full text-sm text-slate-600 dark:text-zinc-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 file:cursor-pointer transition-colors" />
                        {file && (
                            <div className="mt-3 p-3 bg-white dark:bg-zinc-900/60 rounded-xl border border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CheckCircle size={18} className="text-emerald-500" />
                                    <span className="text-sm font-medium text-slate-800 dark:text-zinc-200">{file.name}</span>
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
                        <p className="text-xs text-slate-400 mt-2">Columns: <code className="bg-slate-100 dark:bg-zinc-800/50 px-1 rounded">name, email, company, role, niche, previous_work</code> (case-insensitive)</p>
                    </div>

                    <div className="bg-slate-50 dark:bg-zinc-900/50 p-5 rounded-xl border border-slate-200 dark:border-zinc-800">
                        <label className="block text-sm font-semibold mb-3 text-slate-700 dark:text-zinc-300 flex items-center gap-2"><Clock size={16} className="text-indigo-500" /> Send Time Window</label>
                        <p className="text-xs text-slate-400 mb-3">Emails will only auto-send during this window. Use "Send Now" to bypass it immediately.</p>
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <label className="text-xs text-slate-500 dark:text-zinc-400 font-semibold mb-1 block">Start Time</label>
                                <input type="time" value={formData.send_start} onChange={e => setFormData({ ...formData, send_start: e.target.value })}
                                    className="w-full p-3 bg-white dark:bg-zinc-900/60 border border-slate-300 text-slate-900 dark:text-zinc-50 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                            <div className="text-slate-400 font-bold mt-5">→</div>
                            <div className="flex-1">
                                <label className="text-xs text-slate-500 dark:text-zinc-400 font-semibold mb-1 block">End Time</label>
                                <input type="time" value={formData.send_end} onChange={e => setFormData({ ...formData, send_end: e.target.value })}
                                    className="w-full p-3 bg-white dark:bg-zinc-900/60 border border-slate-300 text-slate-900 dark:text-zinc-50 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                        </div>
                    </div>

                    {/* Follow-up Settings */}
                    <div className="bg-slate-50 dark:bg-zinc-900/50 p-5 rounded-xl border border-slate-200 dark:border-zinc-800">
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-2">
                                <GitBranch size={16} className="text-violet-500" /> Follow-Up Sequence
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <span className="text-xs text-slate-500 dark:text-zinc-400">Enable</span>
                                <input type="checkbox" checked={formData.followup_enabled}
                                    onChange={e => setFormData({ ...formData, followup_enabled: e.target.checked })}
                                    className="w-4 h-4 rounded text-indigo-600" />
                            </label>
                        </div>
                        {formData.followup_enabled && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 dark:text-zinc-400 mb-1 block">Follow-up 1 — delay (hours after initial)</label>
                                        <input type="number" min="1" max="720" value={formData.followup1_delay_hours}
                                            onChange={e => setFormData({ ...formData, followup1_delay_hours: Number(e.target.value) })}
                                            className="w-full p-3 bg-white dark:bg-zinc-900/60 border border-slate-300 text-slate-900 dark:text-zinc-50 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 dark:text-zinc-400 mb-1 block">Follow-up 2 — delay (hours after F1)</label>
                                        <input type="number" min="1" max="720" value={formData.followup2_delay_hours}
                                            onChange={e => setFormData({ ...formData, followup2_delay_hours: Number(e.target.value) })}
                                            className="w-full p-3 bg-white dark:bg-zinc-900/60 border border-slate-300 text-slate-900 dark:text-zinc-50 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 dark:text-zinc-400 mb-1 block">Follow-up 1 Template (optional)</label>
                                        <div className="flex gap-2">
                                            <select value={formData.followup1_template_id} onChange={e => setFormData({ ...formData, followup1_template_id: e.target.value })}
                                                className="flex-1 p-3 bg-white dark:bg-zinc-900/60 border border-slate-300 text-slate-900 dark:text-zinc-50 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
                                                <option value="">-- Same as main (auto) --</option>
                                                {templates.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                                            </select>
                                            <button onClick={() => setView('templates')} className="px-3 py-3 bg-slate-100 dark:bg-zinc-800/50 text-slate-800 dark:text-zinc-200 rounded-xl hover:bg-slate-200 flex items-center gap-1 font-medium border border-slate-300 transition-colors tooltip" title="Create New">
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 dark:text-zinc-400 mb-1 block">Follow-up 2 Template (optional)</label>
                                        <div className="flex gap-2">
                                            <select value={formData.followup2_template_id} onChange={e => setFormData({ ...formData, followup2_template_id: e.target.value })}
                                                className="flex-1 p-3 bg-white dark:bg-zinc-900/60 border border-slate-300 text-slate-900 dark:text-zinc-50 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
                                                <option value="">-- Same as main (auto) --</option>
                                                {templates.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                                            </select>
                                            <button onClick={() => setView('templates')} className="px-3 py-3 bg-slate-100 dark:bg-zinc-800/50 text-slate-800 dark:text-zinc-200 rounded-xl hover:bg-slate-200 flex items-center gap-1 font-medium border border-slate-300 transition-colors tooltip" title="Create New">
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

                    <div className="pt-6 border-t border-slate-200 dark:border-zinc-800 flex justify-between items-center">
                        <button onClick={() => setView('list')} className="px-6 py-2.5 text-slate-600 dark:text-zinc-400 hover:text-slate-800 dark:text-zinc-200 hover:bg-slate-100 dark:bg-zinc-800/50 rounded-xl transition-colors font-semibold">Cancel</button>
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

            {/* Send Now Popout */}
            <AnimatePresence>
                {sendNowCampaign && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={e => { if (e.target === e.currentTarget) setSendNowCampaign(null); }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-zinc-900/60 rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-slate-200 dark:border-zinc-800"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-extrabold text-slate-900 dark:text-zinc-50 flex items-center gap-2">
                                    <Timer size={20} className="text-indigo-500" /> Send Delay
                                </h3>
                                <button onClick={() => setSendNowCampaign(null)} className="p-1 hover:bg-slate-100 dark:bg-zinc-800/50 rounded-lg transition-colors">
                                    <X size={18} className="text-slate-500 dark:text-zinc-400" />
                                </button>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-zinc-400 mb-5 leading-relaxed">
                                Enter the gap time (in seconds) between each email. For example: 60 for 1 minute, 120 for 2 minutes. (0 = no delay)
                            </p>
                            <div className="space-y-5">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5 block uppercase tracking-wider">Delay (Seconds)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={sendNowDelay}
                                        onChange={e => setSendNowDelay(Number(e.target.value))}
                                        className="w-full p-3.5 text-lg font-semibold bg-slate-50 dark:bg-zinc-900/50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900 dark:text-zinc-50"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setSendNowDelay(10)} className="flex-1 py-1.5 bg-slate-100 dark:bg-zinc-800/50 hover:bg-slate-200 text-xs font-semibold text-slate-600 dark:text-zinc-400 rounded-lg transition-colors">10s</button>
                                    <button onClick={() => setSendNowDelay(60)} className="flex-1 py-1.5 bg-slate-100 dark:bg-zinc-800/50 hover:bg-slate-200 text-xs font-semibold text-slate-600 dark:text-zinc-400 rounded-lg transition-colors">1 min</button>
                                    <button onClick={() => setSendNowDelay(120)} className="flex-1 py-1.5 bg-slate-100 dark:bg-zinc-800/50 hover:bg-slate-200 text-xs font-semibold text-slate-600 dark:text-zinc-400 rounded-lg transition-colors">2 min</button>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button onClick={() => setSendNowCampaign(null)} className="flex-1 py-3 rounded-xl border-2 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-bold hover:bg-slate-50 dark:bg-zinc-900/50 transition-colors">Cancel</button>
                                    <button onClick={confirmManualSend} className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold shadow-md shadow-indigo-500/20 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                                        <Send size={16} /> Send Now
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Bulk Send Now Modal ──────────────────────────────────────── */}
            <AnimatePresence>
                {isBulkSendOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={e => { if (e.target === e.currentTarget) setIsBulkSendOpen(false); }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-zinc-900/60 rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-slate-200 dark:border-zinc-800"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-extrabold text-slate-900 dark:text-zinc-50 flex items-center gap-2">
                                    <Send size={20} className="text-indigo-500" /> Bulk Send Now
                                </h3>
                                <button onClick={() => setIsBulkSendOpen(false)} className="p-1 hover:bg-slate-100 dark:bg-zinc-800/50 rounded-lg transition-colors">
                                    <X size={18} className="text-slate-500 dark:text-zinc-400" />
                                </button>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-zinc-400 mb-1 leading-relaxed">
                                Sending <span className="font-bold text-indigo-600">{selectedCampaignIds.length}</span> selected campaign(s) immediately.
                            </p>
                            {(() => {
                                const emptyCampaigns = selectedCampaignIds.filter(id => {
                                    const camp = campaigns.find((c: any) => c.id === id);
                                    return camp && camp.lead_count === 0;
                                });
                                return emptyCampaigns.length > 0 ? (
                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3 flex items-start gap-2">
                                        <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                                        <p className="text-xs text-amber-700 font-semibold">
                                            <span className="font-bold">{emptyCampaigns.length} campaign(s)</span> have 0 leads and will be skipped. Only campaigns with pending leads will send.
                                        </p>
                                    </div>
                                ) : null;
                            })()}
                            <p className="text-sm text-slate-500 dark:text-zinc-400 mb-5 leading-relaxed">
                                Set the gap between emails (in seconds). e.g. 60 = 1 minute delay between each email.
                            </p>
                            <div className="space-y-5">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5 block uppercase tracking-wider">Delay Between Emails (Seconds)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={sendNowDelay}
                                        onChange={e => setSendNowDelay(Number(e.target.value))}
                                        className="w-full p-3.5 text-lg font-semibold bg-slate-50 dark:bg-zinc-900/50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900 dark:text-zinc-50"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setSendNowDelay(10)} className="flex-1 py-1.5 bg-slate-100 dark:bg-zinc-800/50 hover:bg-slate-200 text-xs font-semibold text-slate-600 dark:text-zinc-400 rounded-lg transition-colors">10s</button>
                                    <button onClick={() => setSendNowDelay(60)} className="flex-1 py-1.5 bg-slate-100 dark:bg-zinc-800/50 hover:bg-slate-200 text-xs font-semibold text-slate-600 dark:text-zinc-400 rounded-lg transition-colors">1 min</button>
                                    <button onClick={() => setSendNowDelay(120)} className="flex-1 py-1.5 bg-slate-100 dark:bg-zinc-800/50 hover:bg-slate-200 text-xs font-semibold text-slate-600 dark:text-zinc-400 rounded-lg transition-colors">2 min</button>
                                    <button onClick={() => setSendNowDelay(300)} className="flex-1 py-1.5 bg-slate-100 dark:bg-zinc-800/50 hover:bg-slate-200 text-xs font-semibold text-slate-600 dark:text-zinc-400 rounded-lg transition-colors">5 min</button>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button onClick={() => setIsBulkSendOpen(false)} className="flex-1 py-3 rounded-xl border-2 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-bold hover:bg-slate-50 dark:bg-zinc-900/50 transition-colors">Cancel</button>
                                    <button onClick={confirmBulkSend} className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold shadow-md shadow-indigo-500/20 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                                        <Send size={16} /> Send All Now
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Bulk Send Progress Overlay ────────────────────────────────── */}
            <AnimatePresence>
                {bulkSendProgress && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-2xl max-w-md w-full border border-slate-200 dark:border-zinc-800"
                        >
                            {bulkSendProgress.sending ? (
                                <>
                                    <div className="flex items-center gap-3 mb-6">
                                        <Loader2 size={24} className="animate-spin text-indigo-500" />
                                        <div>
                                            <h3 className="text-lg font-extrabold text-slate-900 dark:text-zinc-50">Sending Campaigns...</h3>
                                            <p className="text-xs text-slate-400">Please wait, do not close this tab</p>
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <div className="flex justify-between text-sm font-semibold text-slate-600 dark:text-zinc-400 mb-2">
                                            <span>Processing campaign {bulkSendProgress.current} of {bulkSendProgress.total}</span>
                                            <span>{Math.round((bulkSendProgress.current / bulkSendProgress.total) * 100)}%</span>
                                        </div>
                                        <div className="h-3 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full bg-indigo-500 rounded-full"
                                                animate={{ width: `${(bulkSendProgress.current / bulkSendProgress.total) * 100}%` }}
                                                transition={{ duration: 0.3 }}
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-400 text-center">Triggering sends for each selected campaign sequentially</p>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center gap-3 mb-4">
                                        <CheckCircle size={28} className="text-emerald-500 shrink-0" />
                                        <div>
                                            <h3 className="text-lg font-extrabold text-slate-900 dark:text-zinc-50">Bulk Send Complete!</h3>
                                            <p className="text-sm text-slate-500 dark:text-zinc-400">
                                                <span className="text-emerald-600 font-bold">{bulkSendProgress.total - bulkSendProgress.errors.length} triggered</span>
                                                {bulkSendProgress.errors.length > 0 && <span className="text-rose-500 font-bold ml-2">{bulkSendProgress.errors.length} failed</span>}
                                            </p>
                                        </div>
                                    </div>
                                    {bulkSendProgress.errors.length > 0 && (
                                        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-4 max-h-48 overflow-y-auto">
                                            <p className="text-xs font-bold text-rose-600 mb-2 uppercase tracking-wider">Failed Campaigns:</p>
                                            {bulkSendProgress.errors.map((err, i) => (
                                                <p key={i} className="text-xs text-rose-600 mb-1">• {err}</p>
                                            ))}
                                        </div>
                                    )}
                                    <button
                                        onClick={() => setBulkSendProgress(null)}
                                        className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors"
                                    >
                                        Done
                                    </button>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bulk Auto-Assign Modal */}
            <AnimatePresence>
                {isBulkAssignOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
                        onClick={e => { if (e.target === e.currentTarget && bulkStatus !== 'loading') setIsBulkAssignOpen(false); }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-zinc-900/60 rounded-3xl p-8 shadow-2xl max-w-2xl w-full border border-slate-200 dark:border-zinc-800 my-8"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-zinc-50 flex items-center gap-2">
                                        <Upload size={24} className="text-emerald-500" /> Bulk Auto-Assign Sheets
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-1">One-click auto-assign bulk Excel/CSV sheets to sender emails</p>
                                </div>
                                <button onClick={() => { if (bulkStatus !== 'loading') setIsBulkAssignOpen(false); }} className="p-2 hover:bg-slate-100 dark:bg-zinc-800/50 rounded-xl transition-colors">
                                    <X size={20} className="text-slate-500 dark:text-zinc-400" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* 1. Upload multiple files */}
                                <div className="bg-slate-50 dark:bg-zinc-900/50 p-5 rounded-xl border border-slate-200 dark:border-zinc-800">
                                    <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-zinc-300">1. Select CSV Lead Sheets (Multiple Files Allowed) *</label>
                                    <input 
                                        type="file" 
                                        multiple 
                                        accept=".csv" 
                                        onChange={e => setBulkFiles(e.target.files)} 
                                        className="block w-full text-sm text-slate-600 dark:text-zinc-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 file:cursor-pointer transition-colors" 
                                    />
                                    {bulkFiles && bulkFiles.length > 0 && (
                                        <div className="mt-4 space-y-3">
                                            <p className="text-xs font-bold text-slate-500">{bulkFiles.length} file(s) selected — assign a specific template to each sheet:</p>
                                            <div className="max-h-72 overflow-y-auto space-y-2 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 rounded-xl p-3">
                                                {Array.from(bulkFiles).map((f, fi) => (
                                                    <div key={fi} className="flex flex-col sm:flex-row sm:items-center gap-2 py-1.5 border-b border-slate-100 dark:border-zinc-800/60 last:border-0">
                                                        <div className="flex-1 min-w-0">
                                                            <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300 truncate block font-mono">{f.name}</span>
                                                            <span className="text-[10px] text-slate-400">({(f.size / 1024).toFixed(1)} KB)</span>
                                                        </div>
                                                        <select
                                                            value={bulkFileTemplates[f.name] || ''}
                                                            onChange={e => setBulkFileTemplates(prev => ({
                                                                ...prev,
                                                                [f.name]: e.target.value
                                                            }))}
                                                            className="text-xs p-2 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 font-semibold min-w-[160px]"
                                                        >
                                                            <option value="">— Use global setting —</option>
                                                            {templates.map((t: any) => (
                                                                <option key={t.id} value={t.id}>{t.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-[10px] text-slate-400">
                                                💡 Leave a sheet on <em>"Use global setting"</em> to apply the Default Template selected below.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* 2. Template Selection */}
                                <div className="bg-slate-50 dark:bg-zinc-900/50 p-5 rounded-xl border border-slate-200 dark:border-zinc-800">
                                    <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-zinc-300">2. Default Fallback Template for All Campaigns *</label>
                                    <select 
                                        value={bulkTemplateId} 
                                        onChange={e => setBulkTemplateId(e.target.value)}
                                        className="w-full p-3.5 bg-white dark:bg-zinc-900/60 border border-slate-300 text-slate-900 dark:text-zinc-50 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                                    >
                                        <option value="random">🌟 (Recommended) Assign a Random Template per Campaign</option>
                                        <option value="random_three">🔄 Rotate between 3 Selected Templates</option>
                                        {templates.map((t: any) => (
                                            <option key={t.id} value={t.id}>{t.name} (Subject: {t.subject})</option>
                                        ))}
                                    </select>
                                    <p className="text-[11px] text-slate-400 mt-2">
                                        Each uploaded sheet will create a separate campaign assigned to a sender email in a round-robin format.
                                    </p>
                                </div>

                                {/* 3-Template Rotation Selectors */}
                                {bulkTemplateId === 'random_three' && (
                                    <div className="bg-slate-50 dark:bg-zinc-900/50 p-5 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-3">
                                        <label className="block text-sm font-bold text-slate-700 dark:text-zinc-300">
                                            Configure 3 Rotation Templates *
                                        </label>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-400 dark:text-zinc-500 mb-1">TEMPLATE A *</label>
                                                <select
                                                    value={rotateTemplateId1}
                                                    onChange={e => setRotateTemplateId1(e.target.value)}
                                                    className="w-full text-xs p-2.5 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                                                >
                                                    <option value="">-- Select --</option>
                                                    {templates.map((t: any) => (
                                                        <option key={t.id} value={t.id}>{t.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-400 dark:text-zinc-500 mb-1">TEMPLATE B *</label>
                                                <select
                                                    value={rotateTemplateId2}
                                                    onChange={e => setRotateTemplateId2(e.target.value)}
                                                    className="w-full text-xs p-2.5 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                                                >
                                                    <option value="">-- Select --</option>
                                                    {templates.map((t: any) => (
                                                        <option key={t.id} value={t.id}>{t.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-400 dark:text-zinc-500 mb-1">TEMPLATE C *</label>
                                                <select
                                                    value={rotateTemplateId3}
                                                    onChange={e => setRotateTemplateId3(e.target.value)}
                                                    className="w-full text-xs p-2.5 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                                                >
                                                    <option value="">-- Select --</option>
                                                    {templates.map((t: any) => (
                                                        <option key={t.id} value={t.id}>{t.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Status message */}
                                {bulkMessage && (
                                    <div className={`p-4 rounded-xl text-sm font-semibold flex items-center gap-2 ${bulkStatus === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' : (bulkStatus === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-50 text-slate-600 border border-slate-200 animate-pulse')}`}>
                                        {bulkStatus === 'loading' && <Loader2 size={16} className="animate-spin" />}
                                        {bulkStatus === 'error' && <AlertCircle size={16} />}
                                        {bulkStatus === 'success' && <CheckCircle size={16} />}
                                        {bulkMessage}
                                    </div>
                                )}

                                {/* Results display */}
                                {bulkResults.length > 0 && (
                                    <div className="bg-slate-50 dark:bg-zinc-900/50 p-5 rounded-xl border border-slate-200 dark:border-zinc-800">
                                        <label className="block text-xs font-bold mb-3 text-slate-700 dark:text-zinc-300 uppercase tracking-wider">Assignment Report:</label>
                                        <div className="max-h-48 overflow-y-auto space-y-2">
                                            {bulkResults.map((res, ri) => (
                                                <div key={ri} className="p-3 bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs">
                                                    <div className="flex justify-between items-center font-bold text-slate-800 dark:text-zinc-200 mb-1">
                                                        <span>{res.filename}</span>
                                                        <span className={res.success ? "text-emerald-600" : "text-rose-600"}>{res.success ? "Success" : "Failed"}</span>
                                                    </div>
                                                    {res.success ? (
                                                        <div className="text-slate-500 space-y-0.5">
                                                            <p>➜ Campaign: <span className="font-semibold text-slate-700 dark:text-zinc-300">{res.campaignName}</span></p>
                                                            <p>➜ Assigned Mailbox: <span className="font-semibold text-slate-700 dark:text-zinc-300">{res.assignedEmail}</span></p>
                                                            <p>➜ Template: <span className="font-semibold text-slate-700 dark:text-zinc-300">{res.templateAssigned}</span></p>
                                                            <p>➜ New Leads: <span className="font-semibold text-emerald-600">{res.newLeads ?? res.leadsCount}</span>
                                                               {res.reassignedLeads > 0 && <span className="ml-2 text-amber-600 font-semibold">· {res.reassignedLeads} re-assigned</span>}</p>
                                                            {(res.newLeads ?? res.leadsCount) === 0 && (
                                                                <p className="text-amber-600 text-[10px] font-semibold mt-1">
                                                                    ⚠️ All leads in this sheet already existed and were moved from another campaign.
                                                                </p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <p className="text-rose-500 font-semibold">Error: {res.error}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-3">
                                    <button 
                                        onClick={() => { if (bulkStatus !== 'loading') setIsBulkAssignOpen(false); }} 
                                        disabled={bulkStatus === 'loading'}
                                        className="flex-1 py-3.5 rounded-xl border-2 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-bold hover:bg-slate-50 dark:bg-zinc-900/50 transition-colors disabled:opacity-50"
                                    >
                                        Close
                                    </button>
                                    {bulkStatus !== 'success' && (
                                        <button 
                                            onClick={handleBulkAssign} 
                                            disabled={bulkStatus === 'loading' || !bulkFiles || bulkFiles.length === 0}
                                            className="flex-1 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-500/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            {bulkStatus === 'loading' ? <><Loader2 size={18} className="animate-spin" /> Processing...</> : <><Upload size={18} /> Create & Assign</>}
                                        </button>
                                    )}
                                    {bulkStatus === 'success' && (
                                        <button 
                                            onClick={async () => {
                                                const ids = bulkResults.filter(r => r.success).map(r => r.campaignId);
                                                if (ids.length === 0) return;
                                                try {
                                                    const res = await fetch('/api/campaigns/bulk-status', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ ids, status: 'running' })
                                                    });
                                                    const data = await res.json();
                                                    if (data.success) {
                                                        alert(`Successfully started ${data.count} campaigns.`);
                                                        setIsBulkAssignOpen(false);
                                                        mutate('/api/campaigns');
                                                    } else {
                                                        alert(`Error: ${data.error}`);
                                                    }
                                                } catch (err: any) {
                                                    alert(`Failed to start: ${err.message}`);
                                                }
                                            }}
                                            className="flex-1 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-500/20 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Play size={18} fill="currentColor" /> Start All Created
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                {/* Header */}
                <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 p-8 rounded-3xl shadow-sm flex flex-col lg:flex-row justify-between lg:items-center gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-zinc-50 tracking-tight mb-1">Campaigns</h1>
                        <p className="text-slate-500 dark:text-zinc-400">Manage and monitor your automated email outreach</p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <button onClick={() => { mutate('/api/campaigns'); }} className="p-2.5 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:text-zinc-50 hover:bg-slate-100 dark:bg-zinc-800/50 rounded-xl border border-slate-200 dark:border-zinc-800 transition-colors" title="Refresh">
                            <RefreshCw size={18} />
                        </button>
                        <button onClick={() => setView('templates')} className="px-5 py-2.5 bg-slate-100 dark:bg-zinc-800/50 text-slate-800 dark:text-zinc-200 hover:bg-slate-200 rounded-xl border border-slate-300 flex items-center gap-2 font-semibold transition-colors">
                            <FileText size={18} /> Templates
                        </button>
                        <button onClick={() => setView('testing')} className="px-5 py-2.5 bg-slate-100 dark:bg-zinc-800/50 text-slate-800 dark:text-zinc-200 hover:bg-slate-200 rounded-xl border border-slate-300 flex items-center gap-2 font-semibold transition-colors">
                            <TestTube size={18} /> Testing
                        </button>
                        <button onClick={() => { setIsBulkAssignOpen(true); setBulkStatus('idle'); setBulkMessage(''); setBulkResults([]); }} className="px-5 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl flex items-center gap-2 font-semibold transition-colors">
                            <Upload size={18} /> Bulk Auto-Assign
                        </button>
                        <button onClick={() => { setEditingCampaign(null); setFormData({ name: '', template_id: '', template_id_b: '', account_ids: [], send_start: '08:00', send_end: '18:00', followup1_delay_hours: 48, followup2_delay_hours: 96, followup1_template_id: '', followup2_template_id: '', followup_enabled: true, ai_personalize_enabled: true, ai_custom_prompt: '' }); setView('create'); }} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-500/20 flex items-center gap-2 font-semibold transition-all hover:scale-[1.02]">
                            <Plus size={18} /> New Campaign
                        </button>
                    </div>
                </div>

                {/* Bulk Actions Bar */}
                {campaigns.length > 0 && (
                    <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 px-6 py-3.5 rounded-2xl flex items-center justify-between gap-4">
                        <label className="flex items-center gap-3 cursor-pointer text-sm font-semibold text-slate-700 dark:text-zinc-300">
                            <input
                                type="checkbox"
                                checked={campaigns.length > 0 && selectedCampaignIds.length === campaigns.length}
                                onChange={toggleSelectAllCampaigns}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4.5 h-4.5 cursor-pointer"
                            />
                            {selectedCampaignIds.length > 0 
                                ? `Selected ${selectedCampaignIds.length} of ${campaigns.length} campaigns`
                                : `Select All Campaigns (${campaigns.length})`
                            }
                        </label>
                        {selectedCampaignIds.length > 0 ? (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleBulkStatus('running')}
                                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
                                >
                                    <Play size={13} fill="currentColor" /> Start Selected
                                </button>
                                <button
                                    onClick={() => handleBulkStatus('paused')}
                                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
                                >
                                    <Pause size={13} fill="currentColor" /> Pause Selected
                                </button>
                                <button
                                    onClick={() => setIsBulkSendOpen(true)}
                                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
                                >
                                    <Send size={13} /> Send Selected Now
                                </button>
                                <button
                                    onClick={handleBulkDelete}
                                    className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
                                >
                                    <Trash size={13} /> Delete Selected
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleAllStatus('running')}
                                    className="px-3.5 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors border border-emerald-200"
                                >
                                    <Play size={13} fill="currentColor" /> Start All Campaigns
                                </button>
                                <button
                                    onClick={() => handleAllStatus('paused')}
                                    className="px-3.5 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors border border-amber-200"
                                >
                                    <Pause size={13} fill="currentColor" /> Pause All Campaigns
                                </button>
                                {campaigns.some((c: any) => c.lead_count === 0) && (
                                    <button
                                        onClick={async () => {
                                            const emptyIds = campaigns.filter((c: any) => c.lead_count === 0).map((c: any) => c.id);
                                            if (!confirm(`Delete ${emptyIds.length} empty campaign(s) with 0 leads?`)) return;
                                            try {
                                                const res = await fetch('/api/campaigns/bulk-delete', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ ids: emptyIds })
                                                });
                                                const data = await res.json();
                                                if (data.success) {
                                                    alert(`Deleted ${data.count} empty campaigns.`);
                                                    mutate('/api/campaigns');
                                                } else {
                                                    alert(`Error: ${data.error}`);
                                                }
                                            } catch (err: any) {
                                                alert(`Failed: ${err.message}`);
                                            }
                                        }}
                                        className="px-3.5 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors border border-rose-200"
                                    >
                                        <Trash size={13} /> Delete Empty ({campaigns.filter((c: any) => c.lead_count === 0).length})
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Campaign Cards */}
                <div className="space-y-4">
                    {campaigns.length === 0 ? (
                        <div className="text-center py-24 bg-white dark:bg-zinc-900/60 rounded-3xl border border-dashed border-slate-200 dark:border-zinc-800">
                            <div className="text-5xl mb-5 opacity-40">🚀</div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-zinc-200 mb-2">No campaigns yet</h3>
                            <p className="text-slate-400 mb-6">Create your first campaign to start outreach.</p>
                            <button onClick={() => { setFormData({ name: '', template_id: '', template_id_b: '', account_ids: [], send_start: '08:00', send_end: '18:00', followup1_delay_hours: 48, followup2_delay_hours: 96, followup1_template_id: '', followup2_template_id: '', followup_enabled: true, ai_personalize_enabled: true, ai_custom_prompt: '' }); setView('create'); }} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors inline-flex items-center gap-2">
                                <Plus size={18} /> New Campaign
                            </button>
                        </div>
                    ) : (
                        campaigns.map((c: any, idx: number) => {
                            const template = templates.find((t: any) => t.id === c.template_id);
                            const progress = c.lead_count > 0 ? Math.round((c.sent_count / c.lead_count) * 100) : 0;
                            const isRunning = c.status === 'running';

                            return (
                                <motion.div
                                    key={c.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="bg-white dark:bg-zinc-900/60 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-sm hover:shadow-md hover:border-slate-300 transition-all overflow-hidden"
                                >
                                    {/* Campaign header */}
                                    <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                        {/* Left: status + info */}
                                        <div className="flex items-center gap-5">
                                            <input
                                                type="checkbox"
                                                checked={selectedCampaignIds.includes(c.id)}
                                                onChange={() => toggleSelectCampaign(c.id)}
                                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4.5 h-4.5 cursor-pointer mr-1"
                                            />
                                            <div className={`p-3 rounded-2xl ${isRunning ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 dark:bg-zinc-800/50 text-slate-400 border border-slate-200 dark:border-zinc-800'}`}>
                                                {isRunning ? <Play size={22} fill="currentColor" /> : <Pause size={22} fill="currentColor" />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className="text-xl font-bold text-slate-900 dark:text-zinc-50">{c.name}</h3>
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${isRunning ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 dark:bg-zinc-800/50 text-slate-500 dark:text-zinc-400'}`}>
                                                        {c.status}
                                                    </span>
                                                    {c.lead_count === 0 && (
                                                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-600 flex items-center gap-1">
                                                            <AlertCircle size={10} /> No Leads
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-400">
                                                    {template && (
                                                        <span className="flex items-center gap-1.5">
                                                            <FileText size={12} className="text-indigo-400" /> {template.name}
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1.5">
                                                        <Send size={12} className="text-indigo-400" />
                                                        <span className="font-bold text-slate-700 dark:text-zinc-300">{c.sent_count}</span> / {c.lead_count} sent
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
                                                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 text-sm font-semibold flex items-center gap-2 transition-colors"
                                            >
                                                <Activity size={15} /> Send Log
                                            </button>
                                            <button
                                                onClick={() => setSendNowCampaign(c)}
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
                                                setFormData({ name: c.name, template_id: String(c.template_id || ''), template_id_b: String(c.template_id_b || ''), account_ids: full.accounts ? full.accounts.map((a: any) => a.id) : [], send_start: c.send_window_start || '08:00', send_end: c.send_window_end || '18:00', followup1_delay_hours: c.followup1_delay_hours || 48, followup2_delay_hours: c.followup2_delay_hours || 96, followup1_template_id: String(c.followup1_template_id || ''), followup2_template_id: String(c.followup2_template_id || ''), followup_enabled: c.followup_enabled !== 0, ai_personalize_enabled: true, ai_custom_prompt: '' });
                                                setView('create');
                                            }} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl border border-slate-200 dark:border-zinc-800 transition-colors">
                                                <Edit size={18} />
                                            </button>
                                            <button onClick={() => deleteCampaign(c.id)} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 dark:border-zinc-800 transition-colors">
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
                                            <div className="h-2 bg-slate-100 dark:bg-zinc-800/50 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${isRunning ? 'bg-indigo-500' : 'bg-slate-300'}`}
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Quick stats bar */}
                                    {c.lead_count > 0 && (
                                        <div className="border-t border-slate-100 dark:border-zinc-800/80 px-6 py-3 flex gap-6 bg-slate-50 dark:bg-zinc-900/50/50">
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
        <div className={`flex items-center gap-1.5 text-xs font-semibold ${color === 'indigo' ? 'text-indigo-600' : 'text-slate-500 dark:text-zinc-400'}`}>
            {icon}
            <span className="font-bold">{value}</span>
            <span className="text-slate-400">{label}</span>
        </div>
    );
}
