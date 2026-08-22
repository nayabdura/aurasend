'use client';

import { useState, useEffect } from 'react';
import { BookOpen, RefreshCw, Send, MailOpen, MessageSquare, AlertTriangle, AlertCircle } from 'lucide-react';

export default function LogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    async function fetchLogs() {
        setLoading(true);
        try {
            const res = await fetch('/api/logs');
            const data = await res.json();
            setLogs(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchLogs();
    }, []);

    function getIconForType(type: string) {
        if (type === 'sent' || type === 'followup') return <Send size={18} className="text-blue-500" />;
        if (type === 'opened') return <MailOpen size={18} className="text-green-500" />;
        if (type === 'replied') return <MessageSquare size={18} className="text-purple-500" />;
        if (type === 'bounced') return <AlertTriangle size={18} className="text-orange-500" />;
        return <AlertCircle size={18} className="text-slate-500 dark:text-zinc-50" />;
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-zinc-50 flex items-center gap-3">
                    <BookOpen size={32} className="text-blue-600" /> Send Logs
                </h1>
                <button onClick={fetchLogs} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors">
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            <div className="bg-white dark:bg-zinc-900/60 rounded-xl shadow-sm border border-slate-100 dark:border-zinc-800/80 dark:border-zinc-800/80 overflow-hidden">
                <div className="max-h-[700px] overflow-y-auto">
                    {logs.length === 0 ? (
                        <p className="text-center text-slate-500 dark:text-zinc-50 py-16 text-lg">No email activity yet. Start a campaign to see logs.</p>
                    ) : (
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 dark:bg-zinc-900/50 dark:bg-zinc-900/30 border-b border-slate-100 dark:border-zinc-800/80 dark:border-zinc-800/80 uppercase text-xs font-semibold text-slate-500 dark:text-zinc-50 sticky top-0">
                                <tr>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Lead Email</th>
                                    <th className="px-6 py-4">Sent From</th>
                                    <th className="px-6 py-4">Campaign</th>
                                    <th className="px-6 py-4">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {logs.map((log: any) => (
                                    <tr key={log.id} className="hover:bg-blue-50/50 transition-colors">
                                        <td className="px-6 py-4 flex items-center gap-2 font-medium capitalize text-slate-700 dark:text-zinc-50">
                                            {getIconForType(log.type)} {log.type}
                                        </td>
                                        <td className="px-6 py-4 text-slate-800 dark:text-zinc-50 font-medium">
                                            {log.lead_email || 'Unknown Lead'}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 dark:text-zinc-50">
                                            {log.gmail_address || 'Unknown Account'}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 dark:text-zinc-50 truncate max-w-[200px]">
                                            {log.campaign_name || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-400">
                                            {new Date(log.timestamp * 1000).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
