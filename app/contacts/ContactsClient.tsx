'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Plus, Search, Filter, Upload, Download, Trash2,
    CheckCircle2, XCircle, Clock, MailX, RefreshCw, ChevronDown
} from 'lucide-react';

const STATUS_STYLES: Record<string, string> = {
    none: 'bg-gray-100 text-gray-600',
    replied: 'bg-green-100 text-green-700',
    bounced: 'bg-red-100 text-red-700',
    unsubscribed: 'bg-orange-100 text-orange-700',
};

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.35 } })
};

export default function ContactsClient() {
    const [contacts, setContacts] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ email: '', first_name: '', last_name: '', company: '', current_role: '' });
    const [saving, setSaving] = useState(false);
    const [selected, setSelected] = useState<Set<number>>(new Set());

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

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp}
                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
                        <Users className="text-indigo-600" size={32} /> Contacts
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">{total} total contacts</p>
                </div>
                <div className="flex gap-3">
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => setShowAdd(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200">
                        <Plus size={18} /> Add Contact
                    </motion.button>
                </div>
            </motion.div>

            {/* Status Summary */}
            <motion.div initial="hidden" animate="visible" custom={1} variants={fadeUp}
                className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { key: '', label: 'All', value: total, icon: <Users size={18} />, color: 'bg-gray-50 text-gray-700 border-gray-200' },
                    { key: 'replied', label: 'Replied', value: statusCounts.replied || 0, icon: <CheckCircle2 size={18} />, color: 'bg-green-50 text-green-700 border-green-200' },
                    { key: 'bounced', label: 'Bounced', value: statusCounts.bounced || 0, icon: <MailX size={18} />, color: 'bg-red-50 text-red-700 border-red-200' },
                    { key: 'none', label: 'No Reply', value: statusCounts.none || 0, icon: <Clock size={18} />, color: 'bg-blue-50 text-blue-700 border-blue-200' },
                ].map((tab, i) => (
                    <button key={tab.key}
                        onClick={() => setStatusFilter(tab.key)}
                        className={`p-4 rounded-xl border-2 transition-all font-semibold text-left ${statusFilter === tab.key ? tab.color + ' shadow-md' : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50'}`}>
                        <div className="flex items-center gap-2 mb-1">{tab.icon} <span className="text-sm">{tab.label}</span></div>
                        <p className="text-2xl font-black">{tab.value}</p>
                    </button>
                ))}
            </motion.div>

            {/* Search & Filters */}
            <motion.div initial="hidden" animate="visible" custom={2} variants={fadeUp}
                className="flex gap-3">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white shadow-sm"
                        placeholder="Search contacts by name, email, company..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <button onClick={loadContacts} className="px-4 py-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all border border-gray-200">
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
            </motion.div>

            {/* Add Contact Modal */}
            <AnimatePresence>
                {showAdd && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        className="bg-white rounded-2xl shadow-xl border-2 border-indigo-100 p-8"
                    >
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Add New Contact</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-600 mb-1">Email *</label>
                                <input
                                    type="email"
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                    placeholder="contact@company.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1">First Name</label>
                                <input className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} placeholder="John" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1">Last Name</label>
                                <input className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} placeholder="Doe" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1">Company</label>
                                <input className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} placeholder="Acme Inc." />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1">Current Role</label>
                                <input className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={form.current_role} onChange={e => setForm({ ...form, current_role: e.target.value })} placeholder="CEO, Marketing Manager..." />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={saveContact} disabled={saving}
                                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50">
                                {saving ? 'Saving...' : 'Save Contact'}
                            </button>
                            <button onClick={() => setShowAdd(false)} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200">
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Contacts Table */}
            <motion.div initial="hidden" animate="visible" custom={3} variants={fadeUp}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50">
                                <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                                <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Company</th>
                                <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Campaign</th>
                                <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Last Contact</th>
                                <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Reply</th>
                                <th className="text-right p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-16">
                                        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                                    </td>
                                </tr>
                            ) : contacts.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-16">
                                        <Users size={48} className="text-gray-200 mx-auto mb-3" />
                                        <p className="text-gray-400 font-medium">No contacts found</p>
                                        <p className="text-sm text-gray-400 mt-1">Add contacts manually or import from a campaign</p>
                                    </td>
                                </tr>
                            ) : contacts.map((contact, i) => (
                                <motion.tr key={contact.id} custom={i}
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                                                {(contact.first_name?.[0] || contact.email?.[0] || '?').toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 text-sm">
                                                    {contact.first_name || contact.last_name
                                                        ? `${contact.first_name} ${contact.last_name}`.trim()
                                                        : contact.email}
                                                </p>
                                                <p className="text-xs text-gray-500">{contact.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">{contact.company || '—'}</p>
                                            <p className="text-xs text-gray-500">{contact.current_role || ''}</p>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-sm text-gray-700">{contact.campaign_name || '—'}</span>
                                        {contact.campaign_status && contact.campaign_status !== 'pending' && (
                                            <div className="text-xs text-gray-400 mt-0.5 capitalize">{contact.campaign_status}</div>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <span className={`text-xs px-2 py-1 rounded-full font-semibold capitalize ${STATUS_STYLES[contact.reply_status] || 'bg-gray-100 text-gray-600'}`}>
                                            {contact.reply_status === 'none' ? 'Pending' : contact.reply_status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-xs text-gray-500">
                                            {contact.last_contact_date ? new Date(contact.last_contact_date).toLocaleDateString() : '—'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {contact.reply_status === 'replied' ? (
                                            <CheckCircle2 size={18} className="text-green-500" />
                                        ) : contact.reply_status === 'bounced' ? (
                                            <XCircle size={18} className="text-red-500" />
                                        ) : (
                                            <Clock size={18} className="text-gray-300" />
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => deleteContact(contact.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
}
