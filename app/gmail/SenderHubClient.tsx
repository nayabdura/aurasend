'use client';

import { useState, useTransition } from 'react';
import { Mail, Zap, Activity, RefreshCw, CheckCircle, AlertCircle, X } from 'lucide-react';
import { motion } from 'framer-motion';
import GmailPageClient from './GmailPageClient';
import AddAccountForm from '@/components/AddAccountForm';
import GmailAccountCard from '@/components/GmailAccountCard';
import WarmupClient from '../warmup/WarmupClient';
import DeliverabilityClient from '../deliverability/DeliverabilityClient';

export default function SenderHubClient({ initialAccounts, userRole }: { initialAccounts: any[], userRole: string }) {
    const [activeTab, setActiveTab] = useState<'accounts' | 'warmup' | 'deliverability'>('accounts');
    const [retrying, setRetrying] = useState(false);
    const [retryResult, setRetryResult] = useState<{ fixed: number; failed: number; needsOAuth: string[]; total: number } | null>(null);
    const [, startTransition] = useTransition();

    const authErrorAccounts = initialAccounts.filter(a => a.status === 'auth_error' || (!a.is_connected && a.status !== 'disconnected' && a.status !== 'deleted'));

    async function handleRetryAll() {
        if (!confirm(`Attempt to auto-reconnect ${authErrorAccounts.length} account(s) with connection issues?`)) return;
        setRetrying(true);
        setRetryResult(null);
        try {
            const res = await fetch('/api/gmail/retry-auth', { method: 'POST' });
            const data = await res.json();
            setRetryResult(data);
            // Refresh the page to reflect updated statuses
            startTransition(() => { window.location.reload(); });
        } catch (e: any) {
            alert('❌ Failed: ' + e.message);
        } finally {
            setRetrying(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-sm gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-zinc-50 tracking-tight mb-2">Sender Infrastructure</h1>
                    <p className="text-zinc-400">Manage accounts, warmup health, and deliverability limits.</p>
                </div>
                <div className="flex gap-2 border-b border-zinc-800 pb-0">
                    <TabButton
                        active={activeTab === 'accounts'}
                        onClick={() => setActiveTab('accounts')}
                        icon={<Mail size={18} />}
                        label="Accounts"
                    />
                    <TabButton
                        active={activeTab === 'warmup'}
                        onClick={() => setActiveTab('warmup')}
                        icon={<Zap size={18} />}
                        label="Warmup Center"
                    />
                    <TabButton
                        active={activeTab === 'deliverability'}
                        onClick={() => setActiveTab('deliverability')}
                        icon={<Activity size={18} />}
                        label="Deliverability"
                    />
                </div>
            </div>

            <div className="animate-in fade-in duration-500">
                {activeTab === 'accounts' && (
                    <div className="space-y-8">
                        <GmailPageClient />

                        {/* Bulk Reconnect Banner — only shown when there are broken accounts */}
                        {authErrorAccounts.length > 0 && (
                            <div className="bg-rose-950/60 border border-rose-700/50 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle size={20} className="text-rose-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-rose-200 font-bold text-sm">
                                            {authErrorAccounts.length} account{authErrorAccounts.length > 1 ? 's' : ''} need{authErrorAccounts.length === 1 ? 's' : ''} reconnection
                                        </p>
                                        <p className="text-rose-400 text-xs mt-0.5">
                                            Click <strong>Retry All</strong> — if tokens are still valid, all accounts will reconnect automatically in one click.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleRetryAll}
                                    disabled={retrying}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors whitespace-nowrap shrink-0"
                                >
                                    <RefreshCw size={15} className={retrying ? 'animate-spin' : ''} />
                                    {retrying ? 'Retrying…' : `Retry All (${authErrorAccounts.length})`}
                                </button>
                            </div>
                        )}

                        {/* Retry result toast */}
                        {retryResult && (
                            <div className={`rounded-2xl border p-5 flex flex-col gap-3 ${retryResult.needsOAuth.length === 0 ? 'bg-emerald-950/60 border-emerald-700/50' : 'bg-amber-950/60 border-amber-700/50'}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 font-bold text-sm text-zinc-100">
                                        <CheckCircle size={16} className="text-emerald-400" />
                                        {retryResult.fixed} of {retryResult.total} account{retryResult.total !== 1 ? 's' : ''} auto-reconnected
                                    </div>
                                    <button onClick={() => setRetryResult(null)} className="text-zinc-500 hover:text-zinc-300">
                                        <X size={14} />
                                    </button>
                                </div>
                                {retryResult.needsOAuth.length > 0 && (
                                    <div>
                                        <p className="text-amber-300 text-xs font-semibold mb-1.5">
                                            These accounts have revoked tokens and still need manual OAuth:
                                        </p>
                                        <ul className="space-y-1">
                                            {retryResult.needsOAuth.map((email: string) => (
                                                <li key={email} className="text-xs text-amber-200 bg-amber-900/40 rounded-lg px-3 py-1.5 font-mono">
                                                    {email}
                                                </li>
                                            ))}
                                        </ul>
                                        <p className="text-xs text-amber-400 mt-2">👆 Use the <strong>"Re-authorize"</strong> button on each card above to fix these individually.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
                            <AddAccountForm />
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                                Connected Accounts
                                <span className="bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full text-xs">{initialAccounts.length}</span>
                            </h2>
                            {initialAccounts.length === 0 ? (
                                <div className="text-center py-20 bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-800">
                                    <div className="text-5xl mb-4 opacity-50">📭</div>
                                    <h3 className="text-lg font-bold text-zinc-200 mb-1">No accounts connected yet</h3>
                                    <p className="text-sm text-zinc-500">Use the form above to add your first Gmail account.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {initialAccounts.map((account: any) => (
                                        <div key={account.id} className="dark-card">
                                            <GmailAccountCard account={account} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'warmup' && (
                    <div className="bg-zinc-900 border border-zinc-800 p-6 lg:p-8 rounded-2xl">
                        <WarmupClient />
                    </div>
                )}

                {activeTab === 'deliverability' && (
                    <div className="bg-zinc-900 border border-zinc-800 p-6 lg:p-8 rounded-2xl">
                        <DeliverabilityClient />
                    </div>
                )}
            </div>
        </div>
    );
}

function TabButton({ active, onClick, icon, label }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-all text-sm border-b-2 ${active
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                }`}
        >
            {icon}
            {label}
        </button>
    );
}
