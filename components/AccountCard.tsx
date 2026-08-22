'use client';
import { Mail, CheckCircle, XCircle, Pause, Play, Trash2, Send } from 'lucide-react';
import { useState } from 'react';

export default function AccountCard({ account }: { account: any }) {
    const [status, setStatus] = useState(account.status);
    const [sending, setSending] = useState(false);

    async function toggleStatus() {
        // Call API to toggle
        // For now simulate
        const newStatus = status === 'active' ? 'paused' : 'active';
        setStatus(newStatus);
        // Ideally call API here
    }

    async function testSend() {
        setSending(true);
        // Call API to send test email
        await new Promise(r => setTimeout(r, 1000));
        setSending(false);
        alert('Test email sent (simulated)');
    }

    return (
        <div className="bg-white dark:bg-zinc-900/60 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-zinc-800/80 dark:border-zinc-800/80 flex items-center justify-between transition-shadow hover:shadow-md">
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${status === 'active' ? 'bg-green-50' : 'bg-red-50'}`}>
                    <Mail className={status === 'active' ? 'text-green-600' : 'text-red-500'} size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-zinc-50">{account.email}</h3>
                    <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-zinc-50 mt-1">
                        <span className={`inline-flex items-center gap-1 font-medium ${status === 'active' ? 'text-green-600' : 'text-red-500'}`}>
                            {status === 'active' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                            {status.toUpperCase()}
                        </span>
                        <span>•</span>
                        <span>Sent Today: <strong>{account.sent_today}</strong> / {account.daily_limit}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button onClick={testSend} disabled={sending}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-zinc-50 bg-slate-50 dark:bg-zinc-900/50 dark:bg-zinc-900/30 rounded-lg hover:bg-slate-100 dark:bg-zinc-800/50 dark:bg-zinc-800/50 transition-colors">
                    <Send size={14} /> {sending ? 'Sending...' : 'Test Send'}
                </button>

                <button onClick={toggleStatus}
                    className={`p-2 rounded-lg transition-colors ${status === 'active' ? 'text-amber-500 hover:bg-amber-50' : 'text-green-500 hover:bg-green-50'}`}
                    title={status === 'active' ? 'Pause Account' : 'Activate Account'}>
                    {status === 'active' ? <Pause size={18} /> : <Play size={18} />}
                </button>

                <button className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Remove Account">
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    );
}
