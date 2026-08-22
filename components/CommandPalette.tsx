'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search,
    Command,
    Mail,
    Users,
    PlayCircle,
    Settings,
    BarChart3,
    Shield,
    Magnet,
    Zap,
    X,
    FileText,
    ArrowRight
} from 'lucide-react';

interface SearchResult {
    id: string | number;
    title: string;
    subtitle?: string;
    type: 'page' | 'lead' | 'campaign' | 'action';
    url?: string;
    icon: React.ReactNode;
    handler?: () => void;
}

export default function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);

    const pages: SearchResult[] = [
        { id: 'p1', title: 'Dashboard', type: 'page', url: '/', icon: <BarChart3 size={18} /> },
        { id: 'p2', title: 'Gmail Accounts', type: 'page', url: '/gmail', icon: <Mail size={18} /> },
        { id: 'p3', title: 'Leads & List', type: 'page', url: '/leads', icon: <Users size={18} /> },
        { id: 'p4', title: 'Contact Enrichment', type: 'page', url: '/enrichment', icon: <Magnet size={18} /> },
        { id: 'p5', title: 'Campaigns', type: 'page', url: '/campaigns', icon: <PlayCircle size={18} /> },
        { id: 'p6', title: 'Templates', type: 'page', url: '/templates', icon: <FileText size={18} /> },
        { id: 'p7', title: 'Settings', type: 'page', url: '/settings', icon: <Settings size={18} /> },
    ];

    const actions: SearchResult[] = [
        { id: 'a1', title: 'Process Send Queue', subtitle: 'Start sending scheduled emails', type: 'action', icon: <Zap size={18} className="text-orange-500" />, handler: () => fetch('/api/process-queue').then(r => alert('Queue processing started!')) },
        { id: 'a2', title: 'Sync Replies', subtitle: 'Manually check Gmail for replies', type: 'action', icon: <Mail size={18} className="text-blue-500" />, handler: () => fetch('/api/check-replies').then(r => alert('Reply sync initiated!')) },
    ];

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape') setIsOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
            setSelectedIndex(0);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
            setQuery('');
        }
    }, [isOpen]);

    useEffect(() => {
        if (!query) {
            setResults([...pages, ...actions]);
            return;
        }

        const fetchResults = async () => {
            // Filter local pages/actions
            const filteredLocal = [...pages, ...actions].filter(r =>
                r.title.toLowerCase().includes(query.toLowerCase()) ||
                r.subtitle?.toLowerCase().includes(query.toLowerCase())
            );

            // Fetch leads/campaigns from search API (needs to be created)
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                if (res.ok) {
                    const data = await res.json();
                    const remoteResults: SearchResult[] = data.results.map((r: any) => ({
                        id: r.id,
                        title: r.title,
                        subtitle: r.subtitle,
                        type: r.type,
                        url: r.url,
                        icon: r.type === 'lead' ? <Users size={18} className="text-green-500" /> : <PlayCircle size={18} className="text-purple-500" />
                    }));
                    setResults([...filteredLocal, ...remoteResults]);
                } else {
                    setResults(filteredLocal);
                }
            } catch (e) {
                setResults(filteredLocal);
            }
        };

        const timeoutId = setTimeout(fetchResults, 200);
        return () => clearTimeout(timeoutId);
    }, [query]);

    const handleSelect = (result: SearchResult) => {
        if (result.handler) {
            result.handler();
        } else if (result.url) {
            router.push(result.url);
        }
        setIsOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % results.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
        } else if (e.key === 'Enter') {
            if (results[selectedIndex]) handleSelect(results[selectedIndex]);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 bg-black/40 backdrop-blur-sm transition-all duration-300">
            <div className="w-full max-w-xl bg-white dark:bg-zinc-900/60 rounded-2xl shadow-2xl border border-slate-100 dark:border-zinc-800/80 dark:border-zinc-800/80 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="relative flex items-center p-4 border-b">
                    <Search className="absolute left-6 text-gray-400" size={20} />
                    <input
                        ref={inputRef}
                        className="w-full pl-12 pr-4 py-2 text-lg text-slate-900 dark:text-zinc-50 placeholder:text-gray-400 outline-none"
                        placeholder="Search leads, campaigns, or pages... (Type 'k' if menu is closed)"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <div className="flex items-center gap-2 px-2 py-1 bg-slate-100 dark:bg-zinc-800/50 dark:bg-zinc-800/50 rounded text-[10px] font-bold text-gray-400 border border-slate-200 dark:border-zinc-800 dark:border-zinc-800">
                        ESC
                    </div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-2 overscroll-contain">
                    {results.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 dark:text-zinc-50 italic">
                            No results found for "{query}"
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {results.map((result, index) => (
                                <button
                                    key={`${result.type}-${result.id}`}
                                    onClick={() => handleSelect(result)}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left group ${index === selectedIndex ? 'bg-blue-600 text-white' : 'hover:bg-slate-50 dark:bg-zinc-900/50 dark:bg-zinc-900/30 text-slate-700 dark:text-zinc-50'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${index === selectedIndex ? 'bg-white dark:bg-zinc-900' : 'bg-slate-100 dark:bg-zinc-800/50 dark:bg-zinc-800/50 group-hover:bg-white dark:bg-zinc-900/60'
                                            }`}>
                                            {result.icon}
                                        </div>
                                        <div>
                                            <div className="font-bold flex items-center gap-2">
                                                {result.title}
                                                <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded ${index === selectedIndex ? 'bg-white dark:bg-zinc-900' : 'bg-slate-100 dark:bg-zinc-800/50 dark:bg-zinc-800/50 text-gray-400'
                                                    }`}>
                                                    {result.type}
                                                </span>
                                            </div>
                                            {result.subtitle && (
                                                <div className={`text-xs ${index === selectedIndex ? 'text-blue-100' : 'text-gray-400'
                                                    }`}>
                                                    {result.subtitle}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {index === selectedIndex && (
                                        <ArrowRight size={16} className="animate-in slide-in-from-left-2" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-3 border-t bg-slate-50 dark:bg-zinc-900/50 dark:bg-zinc-900/30 flex items-center justify-between text-[11px] text-gray-400 font-medium">
                    <div className="flex gap-4">
                        <span className="flex items-center gap-1"><span className="p-0.5 bg-white dark:bg-zinc-900/60 border rounded text-black px-1 shadow-sm">Enter</span> to select</span>
                        <span className="flex items-center gap-1"><span className="p-0.5 bg-white dark:bg-zinc-900/60 border rounded text-black px-1 shadow-sm flex items-center"><ArrowRight size={8} className="rotate-90" /></span> move</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Command size={12} /> + K to toggle
                    </div>
                </div>
            </div>
        </div>
    );
}
