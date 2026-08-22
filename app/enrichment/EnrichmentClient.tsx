'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Loader2, Download, Users, Mail, Phone, ExternalLink,
    Play, Square, List, Plus, Trash, Globe, Linkedin, ShieldCheck,
    Zap, Info, ChevronDown, ChevronUp, RefreshCw, Layers, Edit2
} from 'lucide-react';

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.4 } })
};

export default function EnrichmentClient({ initialContacts }: { initialContacts: any[] }) {
    const [inputType, setInputType] = useState('linkedin'); // linkedin, domain, csv
    const [inputUrl, setInputUrl] = useState('');
    const [csvFile, setCsvFile] = useState<File | null>(null);

    const [loading, setLoading] = useState(false);
    const [isScraping, setIsScraping] = useState(false);
    const stopScrapingRef = useRef(false);

    const [message, setMessage] = useState({ type: '', text: '' });
    const [contacts, setContacts] = useState(initialContacts);
    const [expandedRow, setExpandedRow] = useState<number | null>(null);

    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [search, setSearch] = useState('');
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));

    const startScraping = async (retryUrl?: string) => {
        let urlsToScrape: string[] = [];

        if (retryUrl) {
            urlsToScrape = [retryUrl];
        } else if (inputType === 'csv' && csvFile) {
            const text = await csvFile.text();
            urlsToScrape = text.split('\n').map(line => line.split(',')[0].trim()).filter(Boolean);
            if (urlsToScrape.length > 0 && urlsToScrape[0].toLowerCase().includes('url')) {
                urlsToScrape.shift();
            }
        } else if (inputUrl) {
            urlsToScrape = [inputUrl.trim()];
        }

        if (urlsToScrape.length === 0) return;

        setLoading(true);
        setIsScraping(true);
        stopScrapingRef.current = false;
        setMessage({ type: '', text: '' });
        setProgress({ current: 0, total: urlsToScrape.length });
        setLogs([]);
        addLog(`Started enrichment job for ${urlsToScrape.length} targets...`);

        let processed = 0;
        let foundCount = 0;

        for (const url of urlsToScrape) {
            if (stopScrapingRef.current) {
                setMessage({ type: 'error', text: 'Scraping stopped by user.' });
                break;
            }

            try {
                const res = await fetch('/api/contacts/scrape', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url, type: inputType === 'csv' ? (url.includes('linkedin') ? 'linkedin' : 'domain') : inputType })
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.contacts && data.contacts.length > 0) {
                        setContacts((prev) => [...data.contacts, ...prev]);
                        foundCount += data.contacts.length;
                        addLog(`Successfully enriched: ${url} (${data.contacts.length} found)`);
                    } else if (!data.success) {
                        addLog(`Warning for ${url}: ${data.error}`);
                    } else {
                        addLog(`No data discovered for ${url}`);
                    }
                } else {
                    const errorData = await res.json().catch(() => ({}));
                    addLog(`Error for ${url}: ${errorData.error || 'Server error'}`);
                }
            } catch (e) {
                console.error("Failed scraping", url, e);
            }

            processed++;
            setProgress({ current: processed, total: urlsToScrape.length });
        }

        if (!stopScrapingRef.current) {
            setMessage({ type: 'success', text: `Finished! Found ${foundCount} new contacts.` });
        }

        setIsScraping(false);
        setLoading(false);
        if (!retryUrl) {
            setInputUrl('');
            setCsvFile(null);
        }
    };

    const stopScraping = () => {
        stopScrapingRef.current = true;
    };

    const handleAssignToLeads = async (contactId: number) => {
        try {
            const res = await fetch('/api/contacts/assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contactIds: [contactId] })
            });
            const data = await res.json();
            if (res.ok) {
                alert(`Successfully added to leads! (Duplicates skipped: ${data.duplicates})`);
            } else {
                alert(data.error);
            }
        } catch (e) {
            alert('Error assigning lead.');
        }
    };

    const deleteContact = async (id: number) => {
        if (!confirm('Are you sure you want to delete this contact?')) return;

        setContacts(contacts.filter(c => c.id !== id));
        try {
            await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
        } catch (e) { }
    };

    const editContact = async (contact: any) => {
        const newEmail = prompt('Enter new verified email:', contact.email || '');
        if (newEmail === null) return;
        const newPhone = prompt('Enter new phone (optional):', contact.phone || '');
        if (newPhone === null) return;

        const updated = { ...contact, email: newEmail, phone: newPhone, validation_status: 'MX_VALID' };

        setContacts(contacts.map(c => c.id === contact.id ? updated : c));

        try {
            await fetch(`/api/contacts/${contact.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: newEmail, phone: newPhone, validation_status: 'MX_VALID' })
            });
        } catch (e) { }
    };

    const filteredContacts = contacts.filter(c => {
        const query = search.toLowerCase();
        return (
            (c.name || '').toLowerCase().includes(query) ||
            (c.company || '').toLowerCase().includes(query) ||
            (c.email || '').toLowerCase().includes(query)
        );
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'MX_VALID': return <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1"><ShieldCheck size={10} /> Verified MX</span>;
            case 'PATTERN_ONLY': return <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Pattern-Match</span>;
            default: return <span className="bg-slate-100 dark:bg-zinc-800/50 dark:bg-zinc-800/50 text-slate-500 dark:text-zinc-50 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Unverified</span>;
        }
    };

    const getSourceIcon = (source: string) => {
        if (source === 'linkedin') return <Linkedin size={14} className="text-blue-600" />;
        if (source === 'company_crawl') return <Globe size={14} className="text-emerald-600" />;
        return <Zap size={14} className="text-purple-600" />;
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header & Stats */}
            <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp} className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white dark:bg-zinc-900/60 p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-zinc-800/80 dark:border-zinc-800/80">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-zinc-50 tracking-tight flex items-center gap-3">
                        <Globe className="text-blue-600" size={32} /> Deep Enrichment Engine
                    </h1>
                    <p className="text-slate-500 dark:text-zinc-50 text-lg mt-1">Discover verified contacts and extract data in real-time</p>
                </div>
            </motion.div>

            <motion.div initial="hidden" animate="visible" custom={1} variants={fadeUp} className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard icon={<Users className="text-blue-500" />} title="Total Enriched" value={contacts.length} />
                <StatCard icon={<ShieldCheck className="text-green-500" />} title="MX Verified" value={contacts.filter(c => c.validation_status === 'MX_VALID').length} />
                <StatCard icon={<Layers className="text-purple-500" />} title="Pattern Match" value={contacts.filter(c => c.validation_status === 'PATTERN_ONLY').length} />
                <StatCard icon={<Search className="text-orange-500" />} title="Avg Confidence" value={`${contacts.length > 0 ? Math.round(contacts.reduce((acc, c) => acc + (c.confidence_score || 0), 0) / contacts.length) : 0}%`} />
            </motion.div>

            {/* Input Form */}
            <motion.div initial="hidden" animate="visible" custom={2} variants={fadeUp} className="bg-white dark:bg-zinc-900/60 p-8 rounded-3xl border border-slate-100 dark:border-zinc-800/80 dark:border-zinc-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold">AuraSend Enrichment Engine V2</h2>
                    {isScraping && (
                        <div className="text-sm font-bold text-blue-600 animate-pulse">
                            Processing Stream... ({progress.current}/{progress.total})
                        </div>
                    )}
                </div>

                <div className="flex gap-2 mb-6 border-b pb-4">
                    <button onClick={() => setInputType('linkedin')} className={`px-4 py-2 rounded-t font-medium border-b-2 ${inputType === 'linkedin' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 dark:text-zinc-50 hover:bg-slate-50 dark:bg-zinc-900/50 dark:bg-zinc-900/30'}`}>
                        LinkedIn Profile
                    </button>
                    <button onClick={() => setInputType('domain')} className={`px-4 py-2 rounded-t font-medium border-b-2 ${inputType === 'domain' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 dark:text-zinc-50 hover:bg-slate-50 dark:bg-zinc-900/50 dark:bg-zinc-900/30'}`}>
                        Company Domain / Site
                    </button>
                    <button onClick={() => setInputType('csv')} className={`px-4 py-2 rounded-t font-medium border-b-2 ${inputType === 'csv' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 dark:text-zinc-50 hover:bg-slate-50 dark:bg-zinc-900/50 dark:bg-zinc-900/30'}`}>
                        Bulk CSV
                    </button>
                </div>

                <div className="flex gap-4 items-center">
                    {inputType === 'csv' ? (
                        <div className="flex-1 flex items-center gap-3">
                            <input
                                type="file"
                                accept=".csv"
                                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                                className="block w-full text-sm text-slate-500 dark:text-zinc-50
                                  file:mr-4 file:py-2 file:px-4
                                  file:rounded file:border-0
                                  file:text-sm file:font-semibold
                                  file:bg-blue-50 file:text-blue-700
                                  hover:file:bg-blue-100 border p-2 rounded cursor-pointer"
                            />
                        </div>
                    ) : (
                        <input
                            className="border p-3 flex-1 rounded text-black outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={inputType === 'linkedin' ? "https://linkedin.com/in/username" : "e.g. apple.com"}
                            value={inputUrl}
                            onChange={(e) => setInputUrl(e.target.value)}
                            disabled={isScraping}
                        />
                    )}

                    {!isScraping ? (
                        <button onClick={() => startScraping()} disabled={loading || (inputType === 'csv' && !csvFile) || (inputType !== 'csv' && !inputUrl)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded flex items-center font-bold disabled:opacity-50 transition-colors">
                            <Zap className="mr-2" size={18} /> Deep Scrape
                        </button>
                    ) : (
                        <button onClick={stopScraping} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded flex items-center font-bold transition-colors shadow-lg">
                            <Square className="mr-2 fill-current" size={14} /> Kill Process
                        </button>
                    )}
                </div>

                {isScraping && (
                    <div className="mt-6 flex flex-col gap-4">
                        <div className="w-full bg-slate-200 dark:bg-zinc-800 rounded-full h-3">
                            <div className="bg-gradient-to-r from-blue-500 to-emerald-500 h-3 rounded-full transition-all duration-300" style={{ width: `${(progress.current / progress.total) * 100}%` }}></div>
                        </div>

                        {/* Process Console */}
                        <div className="bg-gray-900 rounded-lg p-4 font-mono text-[11px] text-emerald-400 h-32 overflow-y-auto border-2 border-gray-800 shadow-inner">
                            <div className="flex items-center gap-2 mb-2 border-b border-gray-800 pb-1 text-slate-500 dark:text-zinc-50 uppercase tracking-widest text-[9px] font-bold">
                                <Zap size={10} /> Live Process Console
                            </div>
                            {logs.map((log, i) => (
                                <div key={i} className="mb-0.5 whitespace-pre-wrap">{log}</div>
                            ))}
                        </div>
                    </div>
                )}
            </motion.div>

            {/* Contacts Table Database */}
            <motion.div initial="hidden" animate="visible" custom={3} variants={fadeUp} className="bg-white dark:bg-zinc-900/60 rounded-3xl border border-slate-100 dark:border-zinc-800/80 dark:border-zinc-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 dark:border-zinc-800/80 dark:border-zinc-800/80 bg-slate-50 dark:bg-zinc-900/50 dark:bg-zinc-900/30/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h2 className="font-bold text-slate-800 dark:text-zinc-50 flex items-center gap-2">
                        <List size={18} className="text-slate-500 dark:text-zinc-50" /> Enriched Leads Cache ({filteredContacts.length})
                    </h2>

                    <div className="flex gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search cache..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-9 pr-4 py-2 w-full border rounded outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                        <a href="/api/contacts/export" className="flex items-center text-sm font-medium bg-white dark:bg-zinc-900/60 border px-3 py-2 rounded text-slate-600 dark:text-zinc-50 hover:bg-slate-50 dark:bg-zinc-900/50 dark:bg-zinc-900/30 transition-colors">
                            <Download size={16} className="mr-2" /> Export
                        </a>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-white dark:bg-zinc-900/60 text-slate-500 dark:text-zinc-50 border-b">
                            <tr>
                                <th className="p-4 font-semibold w-10"></th>
                                <th className="p-4 font-semibold">Contact</th>
                                <th className="p-4 font-semibold">Email & Pattern</th>
                                <th className="p-4 font-semibold">Source</th>
                                <th className="p-4 font-semibold">Score</th>
                                <th className="p-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredContacts.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center">
                                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800/50 dark:bg-zinc-800/50 mb-4">
                                            <Search className="text-gray-400" size={24} />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-50 mb-1">No leads found</h3>
                                        <p className="text-slate-500 dark:text-zinc-50">Run the Deep Scraper to discovery real-time data.</p>
                                    </td>
                                </tr>
                            ) : filteredContacts.map((contact) => (
                                <>
                                    <tr key={contact.id} className={`hover:bg-blue-50/50 transition-colors group ${expandedRow === contact.id ? 'bg-blue-50/30' : ''}`}>
                                        <td className="p-4">
                                            <button onClick={() => setExpandedRow(expandedRow === contact.id ? null : contact.id)} className="text-gray-400 hover:text-blue-600 transition-colors">
                                                {expandedRow === contact.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                            </button>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-zinc-800/50 dark:bg-zinc-800/50 flex items-center justify-center text-slate-500 dark:text-zinc-50 font-bold">
                                                    {contact.name?.split(' ').map((n: any) => n[0]).join('') || '?'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-zinc-50 flex items-center gap-2">
                                                        {contact.name}
                                                        {contact.linkedin_url && (
                                                            <a href={contact.linkedin_url} target="_blank" className="text-blue-500 hover:text-blue-700">
                                                                <ExternalLink size={12} />
                                                            </a>
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-zinc-50">{contact.current_role} @ <span className="font-medium">{contact.company}</span></p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <Mail size={14} className="text-gray-400" />
                                                    <span className="font-medium text-slate-700 dark:text-zinc-50">{contact.email || '-'}</span>
                                                    {getStatusBadge(contact.validation_status)}
                                                </div>
                                                {contact.email_pattern && (
                                                    <div className="text-[10px] text-gray-400 font-mono">
                                                        Pattern: <span className="text-blue-500">{contact.email_pattern}</span>@{contact.company_domain || 'domain.com'}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-900/50 dark:bg-zinc-900/30 border px-2 py-1 rounded inline-flex">
                                                {getSourceIcon(contact.source_type)}
                                                <span className="text-[10px] font-bold text-slate-600 dark:text-zinc-50 uppercase tracking-tighter">{contact.source_type?.replace('_', ' ')}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-12 bg-slate-200 dark:bg-zinc-800 rounded-full h-1.5">
                                                    <div className={`h-1.5 rounded-full ${contact.confidence_score > 80 ? 'bg-green-500' : contact.confidence_score > 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${contact.confidence_score}%` }}></div>
                                                </div>
                                                <span className="text-xs font-bold text-slate-600 dark:text-zinc-50">{contact.confidence_score}%</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right space-x-2">
                                            <button onClick={() => startScraping(contact.linkedin_url || contact.company_domain)} title="Re-run Enrichment" className="p-2 text-gray-400 hover:text-blue-600 hover:bg-white dark:bg-zinc-900/60 rounded transition-colors hidden group-hover:inline-block">
                                                <RefreshCw size={16} />
                                            </button>
                                            <button onClick={() => handleAssignToLeads(contact.id)} title="Add to Leads" className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors inline-block">
                                                <Plus size={16} />
                                            </button>
                                            <button onClick={() => editContact(contact)} title="Edit Contact" className="p-2 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded transition-colors inline-block">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => deleteContact(contact.id)} title="Delete" className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors inline-block">
                                                <Trash size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                    {expandedRow === contact.id && (
                                        <tr className="bg-blue-50/20">
                                            <td colSpan={6} className="p-6 border-b">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    <div className="space-y-3">
                                                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                            <Layers size={14} /> Discovery Steps
                                                        </h4>
                                                        <div className="space-y-1">
                                                            {JSON.parse(contact.enrichment_steps || '[]').map((step: string, i: number) => (
                                                                <div key={i} className="flex items-center gap-2 text-xs text-slate-600 dark:text-zinc-50">
                                                                    <div className="w-4 h-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-[10px] font-bold">✓</div>
                                                                    {step.replace(/_/g, ' ')}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                            <Globe size={14} /> Company Intelligence
                                                        </h4>
                                                        <div className="text-xs space-y-2">
                                                            <div>
                                                                <span className="text-gray-400">Official Domain:</span>
                                                                <div className="font-bold text-slate-800 dark:text-zinc-50">{contact.company_domain || 'Unknown'}</div>
                                                            </div>
                                                            {contact.phone && (
                                                                <div>
                                                                    <span className="text-gray-400">Extracted Phone:</span>
                                                                    <div className="font-bold text-slate-800 dark:text-zinc-50 flex items-center gap-1"><Phone size={10} /> {contact.phone}</div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                            <Info size={14} /> Metadata
                                                        </h4>
                                                        <div className="p-3 bg-white dark:bg-zinc-900/60 border border-blue-100 rounded-lg max-h-32 overflow-y-auto">
                                                            <pre className="text-[10px] text-slate-500 dark:text-zinc-50 font-mono whitespace-pre-wrap">
                                                                {JSON.stringify(JSON.parse(contact.metadata || '{}'), null, 2)}
                                                            </pre>
                                                        </div>
                                                        <div className="text-[10px] text-blue-600 font-bold bg-blue-50 p-2 rounded flex items-center gap-2">
                                                            <ShieldCheck size={14} /> Real-time Handshake: Completed
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
}

function StatCard({ icon, title, value }: any) {
    return (
        <div className="bg-white dark:bg-zinc-900/60 p-6 rounded-3xl border border-slate-100 dark:border-zinc-800/80 dark:border-zinc-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
            <div>
                <div className="text-slate-500 dark:text-zinc-50 text-sm font-bold uppercase tracking-wider mb-2">{title}</div>
                <div className="text-4xl font-black text-slate-900 dark:text-zinc-50 tracking-tight">{value}</div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-zinc-900/50 dark:bg-zinc-900/30/80 border border-slate-100 dark:border-zinc-800/80 dark:border-zinc-800/80 rounded-2xl">{icon}</div>
        </div>
    );
}
