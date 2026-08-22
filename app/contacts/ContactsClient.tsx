'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Plus, Search, Upload, Download, Trash2,
    CheckCircle2, XCircle, Clock, MailX, RefreshCw,
    FileText, AlertCircle, X, CheckCircle, Loader2, List, Kanban
} from 'lucide-react';

const STATUS_STYLES: Record<string, string> = {
    none: 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300',
    replied: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400',
    bounced: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400',
    unsubscribed: 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400',
};

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.35 } })
};

// ── CSV Upload Modal ─────────────────────────────────────────────────────────
function CsvUploadModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    async function handleUpload() {
        if (!file) return;
        setUploading(true);
        setError('');
        setResult(null);

        try {
            const fd = new FormData();
            fd.append('file', file);
            const res = await fetch('/api/contacts/upload', { method: 'POST', body: fd });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Upload failed. Please try again.');
            } else {
                setResult(data);
                if (data.added > 0) onSuccess();
            }
        } catch (e: any) {
            setError('Network error: ' + e.message);
        } finally {
            setUploading(false);
        }
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        const dropped = e.dataTransfer.files[0];
        if (dropped && dropped.name.endsWith('.csv')) {
            setFile(dropped);
            setResult(null);
            setError('');
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 w-full max-w-lg overflow-hidden"
            >
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-50 flex items-center gap-2">
                            <Upload size={22} className="text-indigo-500" /> Import Contacts via CSV
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">Bulk import contacts from a CSV file</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                        <X size={20} className="text-slate-500 dark:text-zinc-400" />
                    </button>
                </div>

                <div className="p-8 space-y-5">
                    {/* Drop zone */}
                    <div
                        onDrop={handleDrop}
                        onDragOver={e => e.preventDefault()}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all group ${
                            file
                                ? 'border-indigo-400 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'
                                : 'border-slate-200 dark:border-zinc-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-slate-50 dark:hover:bg-zinc-800/50'
                        }`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={e => {
                                const f = e.target.files?.[0];
                                if (f) { setFile(f); setResult(null); setError(''); }
                            }}
                        />
                        {file ? (
                            <div>
                                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                                    <FileText size={24} className="text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <p className="font-semibold text-slate-800 dark:text-zinc-200">{file.name}</p>
                                <p className="text-sm text-slate-400 dark:text-zinc-500 mt-1">{(file.size / 1024).toFixed(1)} KB — Click to change file</p>
                            </div>
                        ) : (
                            <div>
                                <div className="w-12 h-12 bg-slate-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 transition-colors">
                                    <Upload size={24} className="text-slate-400 dark:text-zinc-500 group-hover:text-indigo-500 transition-colors" />
                                </div>
                                <p className="font-semibold text-slate-700 dark:text-zinc-300">Drop your CSV here or click to browse</p>
                                <p className="text-sm text-slate-400 dark:text-zinc-500 mt-1">Supports .csv files up to 10MB</p>
                            </div>
                        )}
                    </div>

                    {/* Format hint */}
                    <div className="bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 rounded-xl p-4">
                        <p className="text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-2">Required CSV Format</p>
                        <code className="text-xs text-slate-700 dark:text-zinc-300 font-mono block">
                            email, first_name, last_name, company, current_role
                        </code>
                        <p className="text-xs text-slate-400 dark:text-zinc-500 mt-2">
                            Only <strong>email</strong> is required. All other columns are optional. Duplicates are automatically skipped.
                        </p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="flex items-start gap-3 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl">
                            <AlertCircle size={18} className="text-rose-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-rose-700 dark:text-rose-400 font-medium">{error}</p>
                        </div>
                    )}

                    {/* Success result */}
                    {result && (
                        <div className="p-5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl space-y-3">
                            <div className="flex items-center gap-2">
                                <CheckCircle size={20} className="text-emerald-500" />
                                <p className="font-bold text-emerald-700 dark:text-emerald-400">Import Complete!</p>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="text-center bg-white dark:bg-zinc-900 rounded-lg p-3 border border-emerald-100 dark:border-emerald-500/10">
                                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{result.added}</p>
                                    <p className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-bold tracking-wider mt-0.5">Added</p>
                                </div>
                                <div className="text-center bg-white dark:bg-zinc-900 rounded-lg p-3 border border-slate-100 dark:border-zinc-700">
                                    <p className="text-2xl font-black text-slate-600 dark:text-zinc-300">{result.skipped}</p>
                                    <p className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-bold tracking-wider mt-0.5">Skipped</p>
                                </div>
                                <div className="text-center bg-white dark:bg-zinc-900 rounded-lg p-3 border border-rose-100 dark:border-rose-500/10">
                                    <p className="text-2xl font-black text-rose-600 dark:text-rose-400">{result.invalid}</p>
                                    <p className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-bold tracking-wider mt-0.5">Invalid</p>
                                </div>
                            </div>
                            {result.errors && result.errors.length > 0 && (
                                <div className="text-xs text-slate-500 dark:text-zinc-400 space-y-1">
                                    {result.errors.map((e: string, i: number) => (
                                        <p key={i} className="font-mono text-rose-500 dark:text-rose-400">{e}</p>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 border-2 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                        >
                            {result ? 'Close' : 'Cancel'}
                        </button>
                        {!result && (
                            <button
                                onClick={handleUpload}
                                disabled={!file || uploading}
                                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                            >
                                {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                                {uploading ? 'Importing...' : 'Import Contacts'}
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ── Main Contacts Client ──────────────────────────────────────────────────────
export default function ContactsClient() {
    const [contacts, setContacts] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showAdd, setShowAdd] = useState(false);
    const [showCsvModal, setShowCsvModal] = useState(false);
    const [form, setForm] = useState({ email: '', first_name: '', last_name: '', company: '', current_role: '' });
    const [saving, setSaving] = useState(false);
    const [viewMode, setViewMode] = useState<'table' | 'pipeline'>('table');

    useEffect(() => {
        const t = setTimeout(loadContacts, 300);
        return () => clearTimeout(t);
    }, [search, statusFilter]);

    async function loadContacts() {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            if (statusFilter) params.set('status', statusFilter);
            const res = await fetch(`/api/contacts?${params}`);
            const data = await res.json();
            setContacts(data.contacts || []);
            setTotal(data.total || 0);
        } finally {
            setLoading(false);
        }
    }

    async function saveContact() {
        if (!form.email) return alert('Email is required');
        setSaving(true);
        try {
            await fetch('/api/contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            setForm({ email: '', first_name: '', last_name: '', company: '', current_role: '' });
            setShowAdd(false);
            await loadContacts();
        } catch (e) {
            alert('Failed to save contact');
        } finally {
            setSaving(false);
        }
    }

    async function deleteContact(id: number) {
        if (!confirm('Are you sure you want to delete this contact?')) return;
        try {
            const res = await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
            if (res.ok) {
                await loadContacts();
            } else {
                alert('Failed to delete contact');
            }
        } catch (e) {
            alert('Error deleting contact');
        }
    }

    const statusCounts = contacts.reduce((acc: any, c: any) => {
        acc[c.reply_status] = (acc[c.reply_status] || 0) + 1;
        return acc;
    }, {});

    // Kanban filtering
    const newLeads = contacts.filter(c => !c.campaign_name && (c.reply_status === 'none' || !c.reply_status));
    const activeOutreach = contacts.filter(c => c.campaign_name && (c.reply_status === 'none' || !c.reply_status));
    const replied = contacts.filter(c => c.reply_status === 'replied');
    const dndBounced = contacts.filter(c => c.reply_status === 'bounced' || c.reply_status === 'unsubscribed');

    return (
        <div className="space-y-6">
            {/* CSV Upload Modal */}
            <AnimatePresence>
                {showCsvModal && (
                    <CsvUploadModal
                        onClose={() => setShowCsvModal(false)}
                        onSuccess={loadContacts}
                    />
                )}
            </AnimatePresence>

            {/* Header */}
            <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp}
                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-zinc-50 flex items-center gap-3">
                        <Users className="text-indigo-600" size={32} /> Contacts
                    </h1>
                    <p className="text-slate-500 dark:text-zinc-400 text-sm mt-1">{total} total contacts</p>
                </div>
                <div className="flex gap-3 flex-wrap">
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        onClick={() => setShowCsvModal(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 rounded-xl font-semibold shadow-sm hover:bg-slate-50 dark:hover:bg-zinc-700 transition-all">
                        <Upload size={18} className="text-indigo-500" /> Import CSV
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        onClick={() => setShowAdd(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/25 hover:from-indigo-700 hover:to-purple-800 transition-all">
                        <Plus size={18} /> Add Contact
                    </motion.button>
                </div>
            </motion.div>

            {/* Status Summary Cards */}
            <motion.div initial="hidden" animate="visible" custom={1} variants={fadeUp}
                className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { key: '', label: 'All', value: total, icon: <Users size={18} />, color: 'bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 border-slate-200 dark:border-zinc-800', activeColor: 'bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-50 border-slate-300 dark:border-zinc-600' },
                    { key: 'replied', label: 'Replied', value: statusCounts.replied || 0, icon: <CheckCircle2 size={18} />, color: 'bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-400 border-slate-200 dark:border-zinc-800', activeColor: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30' },
                    { key: 'bounced', label: 'Bounced', value: statusCounts.bounced || 0, icon: <MailX size={18} />, color: 'bg-white dark:bg-zinc-900 text-red-700 dark:text-red-400 border-slate-200 dark:border-zinc-800', activeColor: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-300 dark:border-red-500/30' },
                    { key: 'none', label: 'No Reply', value: statusCounts.none || 0, icon: <Clock size={18} />, color: 'bg-white dark:bg-zinc-900 text-blue-700 dark:text-blue-400 border-slate-200 dark:border-zinc-800', activeColor: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-500/30' },
                ].map((tab) => (
                    <button key={tab.key}
                        onClick={() => setStatusFilter(tab.key)}
                        className={`p-4 rounded-xl border-2 transition-all font-semibold text-left hover:shadow-sm ${statusFilter === tab.key ? tab.activeColor + ' shadow-sm' : tab.color}`}>
                        <div className="flex items-center gap-2 mb-1">{tab.icon} <span className="text-sm">{tab.label}</span></div>
                        <p className="text-2xl font-black">{tab.value}</p>
                    </button>
                ))}
            </motion.div>

            {/* Search & Filters */}
            <motion.div initial="hidden" animate="visible" custom={2} variants={fadeUp}
                className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                    <input
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-600 shadow-sm transition-all"
                        placeholder="Search contacts by name, email, company..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 shrink-0">
                    <button
                        onClick={() => setViewMode('table')}
                        className={`px-4 py-2.5 rounded-xl border flex items-center gap-2 font-semibold transition-all shadow-sm text-sm ${viewMode === 'table' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-50'}`}
                    >
                        <List size={16} /> Table
                    </button>
                    <button
                        onClick={() => setViewMode('pipeline')}
                        className={`px-4 py-2.5 rounded-xl border flex items-center gap-2 font-semibold transition-all shadow-sm text-sm ${viewMode === 'pipeline' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-50'}`}
                    >
                        <Kanban size={16} /> Kanban Board
                    </button>
                    <button onClick={loadContacts} className="px-4 py-2.5 bg-white dark:bg-zinc-800 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-700 transition-all border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 shadow-sm">
                        <RefreshCw size={18} className={loading ? 'animate-spin text-indigo-500' : ''} />
                    </button>
                </div>
            </motion.div>

            {/* Add Contact Form */}
            <AnimatePresence>
                {showAdd && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.97, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97, y: -10 }}
                        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border-2 border-indigo-100 dark:border-indigo-500/20 p-8"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-50 flex items-center gap-2">
                                <Plus size={20} className="text-indigo-500" /> Add New Contact
                            </h2>
                            <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                                <X size={18} className="text-slate-400 dark:text-zinc-500" />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-slate-600 dark:text-zinc-400 mb-1">Email *</label>
                                <input
                                    type="email"
                                    className="w-full p-3 border border-slate-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-600 transition-all"
                                    value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                    placeholder="contact@company.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-600 dark:text-zinc-400 mb-1">First Name</label>
                                <input className="w-full p-3 border border-slate-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-600 transition-all"
                                    value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} placeholder="John" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-600 dark:text-zinc-400 mb-1">Last Name</label>
                                <input className="w-full p-3 border border-slate-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-600 transition-all"
                                    value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} placeholder="Doe" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-600 dark:text-zinc-400 mb-1">Company</label>
                                <input className="w-full p-3 border border-slate-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-600 transition-all"
                                    value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} placeholder="Acme Inc." />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-600 dark:text-zinc-400 mb-1">Current Role</label>
                                <input className="w-full p-3 border border-slate-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-600 transition-all"
                                    value={form.current_role} onChange={e => setForm({ ...form, current_role: e.target.value })} placeholder="CEO, Marketing Manager..." />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={saveContact} disabled={saving}
                                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm">
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                {saving ? 'Saving...' : 'Save Contact'}
                            </button>
                            <button onClick={() => setShowAdd(false)} className="px-6 py-3 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all">
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Pipeline View (Kanban Board) */}
            {viewMode === 'pipeline' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    <KanbanColumn title="New Leads" count={newLeads.length} contacts={newLeads} color="border-t-slate-400 bg-slate-50/50 dark:bg-zinc-900/30" deleteContact={deleteContact} />
                    <KanbanColumn title="Active Outreach" count={activeOutreach.length} contacts={activeOutreach} color="border-t-blue-500 bg-blue-50/20 dark:bg-blue-950/10" deleteContact={deleteContact} />
                    <KanbanColumn title="Replied" count={replied.length} contacts={replied} color="border-t-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10" deleteContact={deleteContact} />
                    <KanbanColumn title="DND / Bounced" count={dndBounced.length} contacts={dndBounced} color="border-t-rose-500 bg-rose-50/20 dark:bg-rose-950/10" deleteContact={deleteContact} />
                </div>
            ) : (
                /* Contacts Table */
                <motion.div initial="hidden" animate="visible" custom={3} variants={fadeUp}
                    className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-slate-100 dark:border-zinc-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50">
                                    <th className="text-left p-4 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Contact</th>
                                    <th className="text-left p-4 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Company</th>
                                    <th className="text-left p-4 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Campaign</th>
                                    <th className="text-left p-4 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Status</th>
                                    <th className="text-left p-4 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Last Contact</th>
                                    <th className="text-left p-4 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Reply</th>
                                    <th className="text-right p-4 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-16">
                                            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                                        </td>
                                    </tr>
                                ) : contacts.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-20">
                                            <Users size={48} className="text-slate-200 dark:text-zinc-700 mx-auto mb-4" />
                                            <p className="text-slate-500 dark:text-zinc-400 font-semibold">No contacts found</p>
                                            <p className="text-sm text-slate-400 dark:text-zinc-500 mt-1">Add manually or import a CSV file</p>
                                            <button
                                                onClick={() => setShowCsvModal(true)}
                                                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 rounded-xl font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors text-sm"
                                            >
                                                <Upload size={16} /> Import CSV
                                            </button>
                                        </td>
                                    </tr>
                                ) : contacts.map((contact, i) => (
                                    <motion.tr key={contact.id} custom={i}
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                                        className="border-b border-slate-50 dark:border-zinc-800/50 hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                                    {(contact.first_name?.[0] || contact.email?.[0] || '?').toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900 dark:text-zinc-100 text-sm">
                                                        {contact.first_name || contact.last_name
                                                            ? `${contact.first_name} ${contact.last_name}`.trim()
                                                            : contact.email}
                                                    </p>
                                                    <p className="text-xs text-slate-400 dark:text-zinc-500">{contact.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-sm font-medium text-slate-800 dark:text-zinc-200">{contact.company || '—'}</p>
                                            <p className="text-xs text-slate-400 dark:text-zinc-500">{contact.current_role || ''}</p>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-sm text-slate-700 dark:text-zinc-300">{contact.campaign_name || '—'}</span>
                                            {contact.campaign_status && contact.campaign_status !== 'pending' && (
                                                <div className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5 capitalize">{contact.campaign_status}</div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${STATUS_STYLES[contact.reply_status] || STATUS_STYLES.none}`}>
                                                {contact.reply_status === 'none' ? 'Pending' : contact.reply_status}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-xs text-slate-500 dark:text-zinc-400">
                                                {contact.last_contact_date ? new Date(contact.last_contact_date).toLocaleDateString() : '—'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {contact.reply_status === 'replied' ? (
                                                <CheckCircle2 size={18} className="text-emerald-500" />
                                            ) : contact.reply_status === 'bounced' ? (
                                                <XCircle size={18} className="text-red-500" />
                                            ) : (
                                                <Clock size={18} className="text-slate-300 dark:text-zinc-600" />
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button onClick={() => deleteContact(contact.id)} className="p-2 text-slate-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    {contacts.length > 0 && (
                        <div className="px-6 py-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/30 flex items-center justify-between">
                            <p className="text-sm text-slate-500 dark:text-zinc-400">
                                Showing <strong className="text-slate-700 dark:text-zinc-200">{contacts.length}</strong> of <strong className="text-slate-700 dark:text-zinc-200">{total}</strong> contacts
                            </p>
                            <button
                                onClick={() => setShowCsvModal(true)}
                                className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold transition-colors"
                            >
                                <Upload size={15} /> Import more via CSV
                            </button>
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
}

// ── Kanban Column Component ──────────────────────────────────────────────────
function KanbanColumn({ title, count, contacts, color, deleteContact }: { title: string; count: number; contacts: any[]; color: string; deleteContact: (id: number) => void }) {
    return (
        <div className={`rounded-2xl border border-slate-200 dark:border-zinc-800 p-4 border-t-4 flex flex-col h-[650px] shadow-sm overflow-hidden ${color}`}>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200/60 dark:border-zinc-800">
                <h3 className="font-extrabold text-xs text-slate-800 dark:text-zinc-200 tracking-tight uppercase">{title}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700">
                    {count}
                </span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {contacts.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-12">
                        <Users size={32} className="text-slate-400 mb-2" />
                        <p className="text-xs font-semibold text-slate-500">Column is empty</p>
                    </div>
                ) : (
                    contacts.map((c) => (
                        <div key={c.id} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all relative group">
                            <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="min-w-0">
                                    <h4 className="font-bold text-sm text-slate-800 dark:text-zinc-200 truncate pr-4">
                                        {c.first_name || c.last_name ? `${c.first_name} ${c.last_name}`.trim() : c.email}
                                    </h4>
                                    <p className="text-[11px] text-slate-400 dark:text-zinc-500 truncate mt-0.5">{c.email}</p>
                                </div>
                                <button 
                                    onClick={() => deleteContact(c.id)} 
                                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 rounded-md transition-all absolute top-2 right-2 shrink-0 bg-white dark:bg-zinc-950 shadow-sm border border-slate-150 dark:border-zinc-800"
                                    title="Delete Contact"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                            
                            {(c.company || c.current_role) && (
                                <div className="border-t border-slate-100 dark:border-zinc-800/50 pt-2 mb-2">
                                    {c.company && (
                                        <p className="text-[11px] font-semibold text-slate-600 dark:text-zinc-400 truncate">
                                            🏢 {c.company}
                                        </p>
                                    )}
                                    {c.current_role && (
                                        <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate mt-0.5">
                                            {c.current_role}
                                        </p>
                                    )}
                                </div>
                            )}
                            
                            {c.campaign_name && (
                                <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-lg p-2.5 mt-2">
                                    <p className="text-[9px] font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-wider mb-0.5">Outreach</p>
                                    <p className="text-[11px] font-bold text-indigo-900 dark:text-indigo-300 truncate">{c.campaign_name}</p>
                                    {c.last_contact_date && (
                                        <p className="text-[9px] text-indigo-500 dark:text-indigo-400/80 mt-1 font-semibold">
                                            📅 Contacted: {new Date(c.last_contact_date).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
