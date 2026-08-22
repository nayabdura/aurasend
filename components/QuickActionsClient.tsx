'use client';

import { useState } from 'react';
import * as Lucide from 'lucide-react';
import Link from 'next/link';

export default function QuickActionsClient() {
    const [testEmail, setTestEmail] = useState('');
    const [sending, setSending] = useState(false);

    async function sendTest() {
        if (!testEmail) return alert('Please enter an email address');
        setSending(true);
        try {
            const res = await fetch('/api/send/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: testEmail })
            });
            const data = await res.json();
            if (data.success) {
                alert('✅ Test email sent successfully!');
                setTestEmail('');
            } else {
                alert('❌ Error: ' + (data.error || 'Failed to send'));
            }
        } catch (e) {
            alert('❌ Failed to send test email');
        } finally {
            setSending(false);
        }
    }

    async function quickAction(action: string, count = 1) {
        const confirmed = confirm(`Are you sure you want to ${action}?`);
        if (!confirmed) return;

        try {
            const res = await fetch('/api/send/manual', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ count })
            });
            const data = await res.json();
            if (data.success) {
                alert(`✅ Successfully sent ${count} email(s)!`);
                window.location.reload();
            } else {
                alert('❌ Error: ' + (data.error || 'Failed'));
            }
        } catch (e) {
            alert('❌ Action failed');
        }
    }

    return (
        <div className="bg-gradient-to-r from-slate-50 to-gray-100 p-6 rounded-2xl border-2 border-slate-300 dark:border-zinc-700 shadow-lg">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-zinc-50 mb-4 flex items-center gap-2">
                <Lucide.Zap className="text-yellow-500" size={28} /> Quick Actions & Manual Controls
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <ActionButton
                    icon={<Lucide.Send />}
                    label="Send Next Email"
                    onClick={() => quickAction('send next email', 1)}
                    color="blue"
                />
                <ActionButton
                    icon={<Lucide.FastForward />}
                    label="Send Batch (10)"
                    onClick={() => quickAction('send 10 emails', 10)}
                    color="purple"
                />
                <ActionButton
                    icon={<Lucide.RotateCw />}
                    label="Process Queue"
                    onClick={() => quickAction('process queue manually')}
                    color="emerald"
                />
                <Link href="/logs" className="contents">
                    <button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white p-5 rounded-xl font-semibold flex flex-col items-center gap-2 shadow-md hover:shadow-xl transition-all hover:scale-105 active:scale-95">
                        <Lucide.Activity />
                        <span className="text-sm">View Live Logs</span>
                    </button>
                </Link>
            </div>

            {/* Test Email */}
            <div className="mt-6 p-5 bg-white dark:bg-zinc-900/60 rounded-xl border border-slate-300 dark:border-zinc-700 shadow-sm">
                <h3 className="font-semibold text-slate-700 dark:text-zinc-50 mb-3 flex items-center gap-2">
                    <Lucide.FlaskConical size={18} className="text-indigo-500" /> Test Email Sender
                </h3>
                <div className="flex gap-3">
                    <input
                        type="email"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        placeholder="your.email@example.com"
                        className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <button
                        onClick={sendTest}
                        disabled={sending || !testEmail}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50 transition-all hover:shadow-lg">
                        {sending ? <Lucide.Loader2 className="animate-spin" size={18} /> : <Lucide.Send size={18} />}
                        {sending ? 'Sending...' : 'Test'}
                    </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-50 mt-2">Send a test email to verify your Gmail API connection</p>
            </div>
        </div>
    );
}

function ActionButton({ icon, label, onClick, color }: any) {
    const colors: any = {
        blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
        purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
        emerald: 'from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700',
        orange: 'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
    };

    return (
        <button
            onClick={onClick}
            className={`bg-gradient-to-r ${colors[color]} text-white p-5 rounded-xl font-semibold flex flex-col items-center gap-2 shadow-md hover:shadow-xl transition-all hover:scale-105 active:scale-95`}>
            {icon}
            <span className="text-sm">{label}</span>
        </button>
    );
}
