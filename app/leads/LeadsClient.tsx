'use client';

import { useState, useEffect } from 'react';
import { Users, Search, Filter, Download, Trash2, Shield, Mail, Eye, ListFilter } from 'lucide-react';
import BlacklistClient from '../blacklist/BlacklistClient';

export default function LeadsPage() {
    const [activeTab, setActiveTab] = useState<'contacts' | 'blacklist'>('contacts');
    const [leads, setLeads] = useState<any[]>([]);
    const [filteredLeads, setFilteredLeads] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLeads();
    }, []);

    useEffect(() => {
        filterLeads();
    }, [search, statusFilter, leads]);

    async function loadLeads() {
        const res = await fetch('/api/leads');
        const data = await res.json();
        setLeads(data);
        setLoading(false);
    }

    function filterLeads() {
        let filtered = leads;

        if (search) {
            filtered = filtered.filter(l =>
                l.email?.toLowerCase().includes(search.toLowerCase()) ||
                l.name?.toLowerCase().includes(search.toLowerCase()) ||
                l.company?.toLowerCase().includes(search.toLowerCase())
            );
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(l => l.status === statusFilter);
        }

        setFilteredLeads(filtered);
    }

    async function deleteLead(id: number) {
        if (!confirm('Delete this lead?')) return;
        await fetch(`/api/leads/${id}`, { method: 'DELETE' });
        loadLeads();
    }

    async function exportLeads() {
        const csv = [
            ['Name', 'Email', 'Company', 'Website', 'Status', 'Opened', 'Replied'].join(','),
            ...filteredLeads.map(l => [
                l.name || '',
                l.email || '',
                l.company || '',
                l.website || '',
                l.status || '',
                l.opened ? 'Yes' : 'No',
                l.replied ? 'Yes' : 'No'
            ].join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `leads-export-${Date.now()}.csv`;
        a.click();
    }

    if (loading) return <div className="p-8 text-center text-zinc-500">Loading audience...</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-sm">
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-3 text-zinc-50">
                    <Users size={32} className="text-indigo-500" /> Audience
                </h1>
                <p className="text-zinc-400">View, filter, and manage your contacts, lists, and suppressions.</p>

                {/* Tabs */}
                <div className="flex gap-4 mt-6 border-b border-zinc-800">
                    <button
                        onClick={() => setActiveTab('contacts')}
                        className={`pb-3 px-2 font-medium transition-colors ${activeTab === 'contacts' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        All Contacts
                    </button>
                    <button
                        onClick={() => setActiveTab('blacklist')}
                        className={`pb-3 px-2 font-medium transition-colors ${activeTab === 'blacklist' ? 'text-red-400 border-b-2 border-red-500' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        Blacklist
                    </button>
                </div>
            </div>

            {activeTab === 'blacklist' ? (
                <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
                    <BlacklistClient />
                </div>
            ) : (
                <>
                    {/* Filters & Actions */}
                    <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                            <div className="flex-1 flex gap-3 w-full md:w-auto">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search by name, email, or company..."
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-zinc-800 bg-zinc-950 text-zinc-100 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none placeholder:text-zinc-600 transition-all"
                                    />
                                </div>
                                <select
                                    value={statusFilter}
                                    onChange={e => setStatusFilter(e.target.value)}
                                    className="px-4 py-2 border border-zinc-800 bg-zinc-950 text-zinc-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none transition-all"
                                >
                                    <option value="all">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="sent">Sent</option>
                                    <option value="bounced">Bounced</option>
                                    <option value="invalid">Invalid</option>
                                </select>
                            </div>
                            <button
                                onClick={exportLeads}
                                className="px-5 py-2.5 bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-lg hover:bg-zinc-700 hover:text-white flex items-center gap-2 transition-all font-medium text-sm shadow-sm"
                            >
                                <Download size={16} /> Export CSV
                            </button>
                        </div>
                        <p className="text-sm text-zinc-500 mt-4 font-medium">
                            Showing <span className="text-zinc-300">{filteredLeads.length}</span> of {leads.length} leads
                        </p>
                    </div>

                    {/* Leads Table */}
                    <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-zinc-950 border-b border-zinc-800">
                                    <tr>
                                        <th className="text-left p-4 font-semibold text-zinc-400 text-sm">Name</th>
                                        <th className="text-left p-4 font-semibold text-zinc-400 text-sm">Email</th>
                                        <th className="text-left p-4 font-semibold text-zinc-400 text-sm">Company</th>
                                        <th className="text-center p-4 font-semibold text-zinc-400 text-sm">Status</th>
                                        <th className="text-center p-4 font-semibold text-zinc-400 text-sm">Opened</th>
                                        <th className="text-center p-4 font-semibold text-zinc-400 text-sm">Replied</th>
                                        <th className="text-center p-4 font-semibold text-zinc-400 text-sm">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLeads.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="text-center py-16 text-zinc-500">
                                                No leads found. Switch to active lists or upload a CSV.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredLeads.map(lead => (
                                            <tr key={lead.id} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                                                <td className="p-4 font-medium text-zinc-200">{lead.name || '-'}</td>
                                                <td className="p-4 text-sm text-zinc-400">{lead.email}</td>
                                                <td className="p-4 text-sm text-zinc-400">{lead.company || '-'}</td>
                                                <td className="p-4 text-center">
                                                    <StatusBadge status={lead.status} />
                                                </td>
                                                <td className="p-4 text-center">
                                                    {lead.opened ? (
                                                        <Eye className="inline text-emerald-500" size={16} />
                                                    ) : (
                                                        <span className="text-zinc-700">-</span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-center">
                                                    {lead.replied ? (
                                                        <Mail className="inline text-indigo-400" size={16} />
                                                    ) : (
                                                        <span className="text-zinc-700">-</span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <button
                                                        onClick={() => deleteLead(lead.id)}
                                                        className="text-zinc-500 hover:text-rose-400 p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const defaultClasses = "px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase";

    if (status === 'pending') return <span className={`${defaultClasses} bg-amber-500/10 text-amber-500 border border-amber-500/20`}>{status}</span>;
    if (status === 'sent') return <span className={`${defaultClasses} bg-blue-500/10 text-blue-400 border border-blue-500/20`}>{status}</span>;
    if (status === 'bounced') return <span className={`${defaultClasses} bg-rose-500/10 text-rose-400 border border-rose-500/20`}>{status}</span>;
    if (status === 'invalid') return <span className={`${defaultClasses} bg-zinc-800 text-zinc-400 border border-zinc-700`}>{status}</span>;
    if (status === 'processing') return <span className={`${defaultClasses} bg-purple-500/10 text-purple-400 border border-purple-500/20`}>{status}</span>;

    return (
        <span className={`${defaultClasses} bg-zinc-800 text-zinc-400 border border-zinc-700`}>
            {status}
        </span>
    );
}
