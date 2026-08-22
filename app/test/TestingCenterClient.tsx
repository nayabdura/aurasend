'use client';

import { useState } from 'react';
import {
    TestTube,
    Mail,
    Shield,
    Send,
    CheckCircle,
    XCircle,
    Loader2,
    Play,
    Zap,
    AlertTriangle
} from 'lucide-react';
import SpamChecker from '@/components/SpamChecker';

export default function TestingCenterPage() {
    const [activeTab, setActiveTab] = useState<'verify' | 'bulk' | 'compose' | 'campaign'>('verify');

    return (
        <div className="space-y-6">
            <div className="flex gap-3 flex-wrap border-b border-slate-200 dark:border-zinc-800 pb-2">
                <TabButton
                    active={activeTab === 'verify'}
                    onClick={() => setActiveTab('verify')}
                    icon={<Shield size={18} />}
                    label="Single Verify"
                />
                <TabButton
                    active={activeTab === 'bulk'}
                    onClick={() => setActiveTab('bulk')}
                    icon={<Mail size={18} />}
                    label="Bulk Verify"
                />
                <TabButton
                    active={activeTab === 'compose'}
                    onClick={() => setActiveTab('compose')}
                    icon={<Mail size={18} />}
                    label="Compose & Test"
                />
                <TabButton
                    active={activeTab === 'campaign'}
                    onClick={() => setActiveTab('campaign')}
                    icon={<Play size={18} />}
                    label="Manual Campaign"
                />
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 p-8">
                {activeTab === 'verify' && <EmailVerifierTab />}
                {activeTab === 'bulk' && <BulkVerifierTab />}
                {activeTab === 'compose' && <ComposeTestTab />}
                {activeTab === 'campaign' && <ManualCampaignTab />}
            </div>
        </div>
    );
}

function TabButton({ active, onClick, icon, label }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-colors text-sm ${active
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-700'
                }`}
        >
            {icon}
            {label}
        </button>
    );
}

// Tab 1: Email Verifier
function EmailVerifierTab() {
    const [email, setEmail] = useState('');
    const [result, setResult] = useState<any>(null);
    const [checking, setChecking] = useState(false);

    async function verify() {
        setChecking(true);
        setResult(null);
        try {
            const res = await fetch('/api/leads/verify-single', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            setResult(data);
        } catch (e) {
            setResult({ isValid: false, reason: 'Network error', score: 0 });
        } finally {
            setChecking(false);
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-100 mb-2 flex items-center gap-2">
                    <Shield className="text-indigo-500" size={24} /> Verify Single Email
                </h2>
                <p className="text-slate-500 dark:text-zinc-400 text-sm">
                    Deep verification including SMTP handshake, role detection, and MX analysis.
                </p>
            </div>

            <div className="flex gap-3">
                <input
                    type="email"
                    placeholder="test@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 px-4 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-600"
                    onKeyDown={(e) => e.key === 'Enter' && verify()}
                />
                <button
                    onClick={verify}
                    disabled={checking || !email}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-semibold flex items-center gap-2 disabled:opacity-50 transition-colors shadow-sm"
                >
                    {checking ? <Loader2 className="animate-spin" size={20} /> : <Shield size={20} />}
                    <span>{checking ? 'Verifying...' : 'Verify'}</span>
                </button>
            </div>

            {result && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className={`p-6 rounded-2xl border ${result.isValid ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20'}`}>
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                {result.isValid ? (
                                    <div className="p-3 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400">
                                        <CheckCircle size={32} />
                                    </div>
                                ) : (
                                    <div className="p-3 bg-rose-100 dark:bg-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400">
                                        <XCircle size={32} />
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-zinc-100">{email}</h3>
                                    <p className={`text-sm font-semibold tracking-wider uppercase mt-1 ${result.isValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                        {result.status}
                                    </p>
                                </div>
                            </div>

                            <div className="text-center">
                                <div className="text-3xl font-black text-slate-900 dark:text-zinc-100">{result.score}/100</div>
                                <div className="text-[10px] text-slate-500 dark:text-zinc-500 uppercase tracking-widest font-bold">Quality Score</div>
                            </div>
                        </div>

                        {result.status === 'disabled' && (
                            <div className="mt-4 p-4 bg-rose-100 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-rose-700 dark:text-rose-300 text-sm font-medium flex items-center gap-3">
                                <AlertTriangle size={18} />
                                <span>Account disabled or deactivated by provider. Unsafe to send.</span>
                            </div>
                        )}
                        {result.isFullInbox && (
                            <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl text-amber-700 dark:text-amber-500 text-sm font-medium flex items-center gap-3">
                                <AlertTriangle size={18} />
                                <span>Mailbox is full. Delivery will likely fail.</span>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <ResultCard label="Status" value={result.status} highlight={result.status === 'valid'} />
                        <ResultCard label="Safe to Send" value={result.isValid ? 'Yes' : 'No'} highlight={result.isValid} />
                        <ResultCard label="Deliverable" value={result.isDeliverable ? 'Yes' : 'No'} highlight={result.isDeliverable} />
                        <ResultCard label="Role Account" value={result.isRoleAccount ? 'Yes' : 'No'} highlight={!result.isRoleAccount} inverse />
                        <ResultCard label="Catch All" value={result.isCatchAll ? 'Yes' : 'No'} highlight={!result.isCatchAll} inverse />
                        <ResultCard label="Disposable" value={result.isDisposable ? 'Yes' : 'No'} highlight={!result.isDisposable} inverse />
                        <ResultCard label="Inbox Full" value={result.isFullInbox ? 'Yes' : 'No'} highlight={!result.isFullInbox} inverse />
                        <ResultCard label="SMTP Connect" value={result.canConnectSmtp ? 'Yes' : 'No'} highlight={result.canConnectSmtp} />
                    </div>

                    <div className="bg-slate-50 dark:bg-zinc-950 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
                        <h4 className="font-bold text-slate-700 dark:text-zinc-200 mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                            <Zap size={16} className="text-indigo-400" /> MX Records Check
                        </h4>
                        <div className="space-y-2">
                            {result.mxRecords && result.mxRecords.length > 0 ? (
                                result.mxRecords.map((mx: string, i: number) => (
                                    <div key={i} className="font-mono text-sm bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-3 rounded-lg text-slate-600 dark:text-zinc-400">
                                        {mx}
                                    </div>
                                ))
                            ) : (
                                <p className="text-slate-400 dark:text-zinc-600 text-sm italic">No MX records returned</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ResultCard({ label, value, highlight, inverse }: any) {
    let colorClass = "text-slate-800 dark:text-zinc-100";
    if (highlight) colorClass = "text-emerald-600 dark:text-emerald-400";
    else if (inverse && value === 'Yes') colorClass = "text-rose-600 dark:text-rose-400";
    else if (!highlight && !inverse) colorClass = "text-rose-600 dark:text-rose-400";

    return (
        <div className="bg-slate-50 dark:bg-zinc-950 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
            <p className="text-[10px] text-slate-500 dark:text-zinc-500 uppercase tracking-widest font-bold mb-1.5">{label}</p>
            <p className={`text-lg font-bold ${colorClass}`}>{value}</p>
        </div>
    );
}

// Tab 2: Bulk Email Verifier
function BulkVerifierTab() {
    const [emails, setEmails] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [checking, setChecking] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });

    async function verifyBulk() {
        const emailList = emails.split('\n').map(e => e.trim()).filter(e => e);

        if (emailList.length === 0) {
            return alert('Enter at least one email');
        }

        if (emailList.length > 100) {
            return alert('Maximum 100 emails at a time');
        }

        setChecking(true);
        setResults([]);
        setProgress({ current: 0, total: emailList.length });

        const verifiedResults: any[] = [];

        for (let i = 0; i < emailList.length; i++) {
            const email = emailList[i];
            setProgress({ current: i + 1, total: emailList.length });

            try {
                const res = await fetch('/api/leads/verify-single', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                const data = await res.json();
                verifiedResults.push({ email, ...data });
            } catch (e) {
                verifiedResults.push({ email, isValid: false, reason: 'Network error', score: 0 });
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        setResults(verifiedResults);
        setChecking(false);
    }

    function exportResults() {
        const csv = [
            ['Email', 'Valid', 'Score', 'Status', 'Reason'].join(','),
            ...results.map(r => [
                r.email,
                r.isValid ? 'Yes' : 'No',
                r.score || 0,
                r.status || 'unknown',
                r.reason || 'Valid'
            ].join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `verification-bulk-${Date.now()}.csv`;
        a.click();
    }

    const validCount = results.filter(r => r.isValid).length;
    const invalidCount = results.length - validCount;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-100 mb-2 flex items-center gap-2">
                    <Mail className="text-indigo-400" size={24} /> Bulk Verification
                </h2>
                <p className="text-slate-500 dark:text-zinc-400 text-sm">
                    Verify up to 100 emails at once. Checks format, MX, and SMTP.
                </p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-semibold text-slate-600 dark:text-zinc-400 mb-2">Paste Email List (one per line)</label>
                    <textarea
                        value={emails}
                        onChange={(e) => setEmails(e.target.value)}
                        placeholder={"test1@example.com\ntest2@example.com\ntest3@example.com"}
                        className="w-full h-48 px-4 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none font-mono text-sm resize-none placeholder:text-slate-400 dark:placeholder:text-zinc-700 transition-all"
                        disabled={checking}
                    />
                    <p className="text-xs text-slate-400 dark:text-zinc-600 mt-2 font-medium">
                        {emails.split('\n').filter(e => e.trim()).length} email(s) currently staged out of 100 limit.
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={verifyBulk}
                        disabled={checking || !emails.trim()}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-xl font-bold flex items-center justify-center gap-3 disabled:opacity-50 transition-colors shadow-sm"
                    >
                        {checking ? <Loader2 className="animate-spin" size={20} /> : <Shield size={20} />}
                        {checking ? `Verifying ${progress.current}/${progress.total}...` : 'Verify Batch'}
                    </button>
                    {results.length > 0 && (
                        <button
                            onClick={exportResults}
                            className="px-6 py-3.5 bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-xl font-bold flex items-center gap-2 transition-colors"
                        >
                            <CheckCircle size={18} className="text-emerald-500" /> Export CSV
                        </button>
                    )}
                </div>
            </div>

            {results.length > 0 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-slate-50 dark:bg-zinc-950 p-5 rounded-xl border border-slate-200 dark:border-zinc-800 text-center">
                            <p className="text-3xl font-black text-slate-900 dark:text-zinc-100">{results.length}</p>
                            <p className="text-xs text-slate-500 dark:text-zinc-500 uppercase tracking-widest mt-1 font-bold">Total</p>
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-500/10 p-5 rounded-xl border border-emerald-200 dark:border-emerald-500/20 text-center">
                            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{validCount}</p>
                            <p className="text-xs text-emerald-600 dark:text-emerald-600 uppercase tracking-widest mt-1 font-bold">Valid ({results.length > 0 ? ((validCount / results.length) * 100).toFixed(0) : 0}%)</p>
                        </div>
                        <div className="bg-rose-50 dark:bg-rose-500/10 p-5 rounded-xl border border-rose-200 dark:border-rose-500/20 text-center">
                            <p className="text-3xl font-black text-rose-600 dark:text-rose-400">{invalidCount}</p>
                            <p className="text-xs text-rose-600 dark:text-rose-600 uppercase tracking-widest mt-1 font-bold">Invalid ({results.length > 0 ? ((invalidCount / results.length) * 100).toFixed(0) : 0}%)</p>
                        </div>
                    </div>

                    <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-zinc-950">
                        <div className="max-h-96 overflow-y-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 sticky top-0 shadow-sm">
                                    <tr>
                                        <th className="p-4 text-xs font-semibold text-slate-500 dark:text-zinc-500 uppercase tracking-wider">Email</th>
                                        <th className="p-4 text-xs font-semibold text-slate-500 dark:text-zinc-500 uppercase tracking-wider text-center">Valid</th>
                                        <th className="p-4 text-xs font-semibold text-slate-500 dark:text-zinc-500 uppercase tracking-wider text-center">Score</th>
                                        <th className="p-4 text-xs font-semibold text-slate-500 dark:text-zinc-500 uppercase tracking-wider">Status</th>
                                        <th className="p-4 text-xs font-semibold text-slate-500 dark:text-zinc-500 uppercase tracking-wider">Reason</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                                    {results.map((result, i) => (
                                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors">
                                            <td className="p-4 font-mono text-sm text-slate-700 dark:text-zinc-300">{result.email}</td>
                                            <td className="p-4 text-center">
                                                {result.isValid ? (
                                                    <CheckCircle size={18} className="text-emerald-500 mx-auto" />
                                                ) : (
                                                    <XCircle size={18} className="text-rose-500 mx-auto" />
                                                )}
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`font-bold text-sm ${result.score > 70 ? 'text-emerald-600 dark:text-emerald-400' : (result.score > 40 ? 'text-amber-600 dark:text-amber-500' : 'text-rose-600 dark:text-rose-500')}`}>
                                                    {result.score || 0}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm">
                                                <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider border ${result.status === 'valid' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' :
                                                    result.status === 'disabled' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20' :
                                                        'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700'
                                                    }`}>
                                                    {result.status || 'unknown'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-xs text-slate-500 dark:text-zinc-500 truncate max-w-[200px]" title={result.reason}>
                                                {result.reason || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Tab 3: Compose & Test
function ComposeTestTab() {
    const [toEmail, setToEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [sending, setSending] = useState(false);

    async function sendTest() {
        if (!toEmail || !subject || !body) return alert('All fields required');
        setSending(true);
        try {
            const res = await fetch('/api/send/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to: toEmail, subject, body })
            });
            const data = await res.json();
            alert(data.success ? '✅ Test email sent!' : '❌ Failed to send');
        } catch (e) {
            alert('❌ Network error');
        } finally {
            setSending(false);
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-100 mb-2 flex items-center gap-2">
                    <Send className="text-indigo-400" size={24} /> Compose & Test Sandbox
                </h2>
                <p className="text-slate-500 dark:text-zinc-400 text-sm">
                    Safely compose a test payload and instantly review copy spam heuristics.
                </p>
            </div>

            <div className="space-y-5 bg-slate-50 dark:bg-zinc-950 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800">
                <div>
                    <label className="block text-sm font-semibold text-slate-600 dark:text-zinc-400 mb-2">Recipient Email</label>
                    <input
                        type="email"
                        value={toEmail}
                        onChange={(e) => setToEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-700"
                        placeholder="recipient@example.com"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-600 dark:text-zinc-400 mb-2">Test Subject</label>
                    <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-700"
                        placeholder="Enter email subject line..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-600 dark:text-zinc-400 mb-2">Draft Body</label>
                    <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        className="w-full h-48 px-4 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none resize-none transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-700 font-mono text-sm"
                        placeholder="Email body content structure goes here..."
                    />
                </div>

                <button
                    onClick={sendTest}
                    disabled={sending || !toEmail || !subject || !body}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-3 disabled:opacity-50 transition-colors shadow-sm"
                >
                    {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                    {sending ? 'Injecting Payload...' : 'Fire Test Payload'}
                </button>

                {subject && body && (
                    <div className="pt-4 border-t border-slate-200 dark:border-zinc-800">
                        <SpamChecker subject={subject} body={body} />
                    </div>
                )}
            </div>
        </div>
    );
}

// Tab 4: Manual Campaign
function ManualCampaignTab() {
    const [count, setCount] = useState(10);
    const [running, setRunning] = useState(false);
    const [results, setResults] = useState<any>(null);

    async function runCampaign() {
        if (!confirm(`Force trigger ${count} manual dispatches immediately?`)) return;
        setRunning(true);
        try {
            const res = await fetch('/api/send/manual', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ count })
            });
            const data = await res.json();
            setResults(data);
            alert(`✅ Action Complete. Dispatched: ${data.sent || 0}`);
        } catch (e) {
            alert('❌ Failed to run emergency dispatch');
        } finally {
            setRunning(false);
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-100 mb-2 flex items-center gap-2">
                    <Zap className="text-amber-500" size={24} /> Force Manual Trigger
                </h2>
                <p className="text-slate-500 dark:text-zinc-400 text-sm">
                    Manually trigger emergency or test dispatches. Bypasses standard time window protections.
                </p>
            </div>

            <div className="space-y-5 bg-slate-50 dark:bg-zinc-950 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800">
                <div>
                    <label className="block text-sm font-semibold text-slate-600 dark:text-zinc-400 mb-2">Payload Dispatch Count</label>
                    <input
                        type="number"
                        value={count}
                        onChange={(e) => setCount(parseInt(e.target.value))}
                        min="1"
                        max="100"
                        className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 rounded-xl focus:ring-2 focus:ring-amber-500/50 outline-none transition-all"
                    />
                </div>

                <button
                    onClick={runCampaign}
                    disabled={running}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-amber-950 px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-3 disabled:opacity-50 transition-colors shadow-sm"
                >
                    {running ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} />}
                    {running ? 'Overriding System Engine...' : `Force Dispatch ${count} Items`}
                </button>

                {results && (
                    <div className="p-6 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl">
                        <h3 className="font-bold text-emerald-700 dark:text-emerald-400 mb-4 uppercase tracking-wider text-xs">Dispatch Audit Result</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-500/20 p-4 rounded-xl text-center">
                                <p className="text-slate-500 dark:text-zinc-500 uppercase font-bold text-[10px] tracking-widest mb-1">Delivered</p>
                                <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{results.sent || 0}</p>
                            </div>
                            <div className="bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-500/20 p-4 rounded-xl text-center">
                                <p className="text-slate-500 dark:text-zinc-500 uppercase font-bold text-[10px] tracking-widest mb-1">Failed</p>
                                <p className="text-3xl font-black text-rose-600 dark:text-rose-500">{results.failed || 0}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function CheckItem({ label, passed }: { label: string; passed: boolean }) {
    return (
        <div className="flex items-center gap-2">
            {passed ? (
                <CheckCircle className="text-emerald-500" size={16} />
            ) : (
                <XCircle className="text-rose-500" size={16} />
            )}
            <span className="text-xs font-medium text-slate-600 dark:text-zinc-400">{label}</span>
        </div>
    );
}
