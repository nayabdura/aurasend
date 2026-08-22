'use client';

import { useState } from 'react';
import { Mail, Power, Play, Pause, Edit, Save, X, Shield, Key, Lock, AlertTriangle, Tag, Check, Edit2, RefreshCw } from 'lucide-react';
import { disconnectAccount, activateAccount, pauseAccount, updateSignature, updateAccountName, updateDailyLimit } from '@/app/gmail/actions';
import { useRouter } from 'next/navigation';
import RichTextEditor from '@/components/RichTextEditor';

const AUTH_METHOD_CONFIG: Record<string, { label: string; icon: JSX.Element; color: string }> = {
    oauth: { label: 'OAuth', icon: <Shield size={12} />, color: 'bg-indigo-100 text-indigo-700' },
    app_password: { label: 'App Password', icon: <Key size={12} />, color: 'bg-emerald-100 text-emerald-700' },
    smtp: { label: 'SMTP', icon: <Lock size={12} />, color: 'bg-amber-100 text-amber-700' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    active: { label: 'Active', color: 'text-emerald-600' },
    pending_auth: { label: 'Pending Auth', color: 'text-amber-500' },
    paused: { label: 'Paused', color: 'text-slate-900 dark:text-zinc-400' },
    auth_error: { label: 'Auth Error', color: 'text-rose-600' },
    quota_limit: { label: 'Quota Limit', color: 'text-orange-500' },
};

export default function GmailAccountCard({ account }: { account: any }) {
    const [isEditing, setIsEditing] = useState(false);
    const [signature, setSignature] = useState(account.signature || '');
    const [saving, setSaving] = useState(false);
    const [reconnecting, setReconnecting] = useState(false);

    // Nickname state
    const [isEditingName, setIsEditingName] = useState(false);
    const [accountName, setAccountName] = useState(account.name || '');
    const [savingName, setSavingName] = useState(false);

    // Limit state
    const [isEditingLimit, setIsEditingLimit] = useState(false);
    const [limitValue, setLimitValue] = useState(account.daily_limit?.toString() || '40');
    const [savingLimit, setSavingLimit] = useState(false);

    const router = useRouter();

    const authConfig = AUTH_METHOD_CONFIG[account.auth_method] || AUTH_METHOD_CONFIG.oauth;
    const statusConfig = STATUS_CONFIG[account.status] || { label: account.status, color: 'text-slate-900 dark:text-zinc-400' };
    const isConnected = !!account.is_connected;
    const isAuthError = account.status === 'auth_error';
    const needsReauth = (!isConnected || isAuthError) && account.auth_method === 'oauth';
    const sentPercent = account.daily_limit > 0
        ? Math.min(100, Math.round((account.sent_today / account.daily_limit) * 100))
        : 0;

    async function handleReconnect() {
        setReconnecting(true);
        try {
            const res = await fetch('/api/gmail/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: account.email,
                    name: account.name,
                    dailyLimit: account.daily_limit,
                })
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert('❌ ' + (data.error || 'Failed to generate reconnect URL'));
            }
        } catch (e: any) {
            alert('❌ Error: ' + e.message);
        } finally {
            setReconnecting(false);
        }
    }

    async function handleSignatureSave() {
        setSaving(true);
        try {
            await updateSignature(account.id, signature);
            setIsEditing(false);
            router.refresh();
        } finally {
            setSaving(false);
        }
    }

    async function handleNameSave() {
        setSavingName(true);
        try {
            await updateAccountName(account.id, accountName);
            setIsEditingName(false);
            router.refresh();
        } finally {
            setSavingName(false);
        }
    }

    async function handleLimitSave() {
        const val = parseInt(limitValue);
        if (isNaN(val) || val <= 0) return alert('Invalid limit');
        setSavingLimit(true);
        try {
            await updateDailyLimit(account.id, val);
            setIsEditingLimit(false);
            router.refresh();
        } finally {
            setSavingLimit(false);
        }
    }

    return (
        <div className={`bg-slate-50 dark:bg-zinc-900/50 rounded-2xl shadow-sm border-2 transition-all hover:shadow-md ${isAuthError ? 'border-rose-200' :
            isConnected ? 'border-slate-200 dark:border-zinc-800' : 'border-amber-200'
            }`}>
            <div className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4 min-w-0">
                        {/* Status indicator */}
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isConnected ? 'bg-emerald-100' : 'bg-white dark:bg-zinc-900'
                            }`}>
                            <Mail size={24} className={isConnected ? 'text-emerald-600' : 'text-slate-400'} />
                        </div>
                        <div className="min-w-0 flex-1">
                            {/* Account Name / Nickname Row */}
                            <div className="flex items-center gap-2 mb-0.5">
                                {isEditingName ? (
                                    <div className="flex items-center gap-1.5 flex-1">
                                        <input
                                            type="text"
                                            value={accountName}
                                            onChange={e => setAccountName(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') handleNameSave(); if (e.key === 'Escape') setIsEditingName(false); }}
                                            placeholder="e.g. Sales Outreach, Main Account..."
                                            autoFocus
                                            className="flex-1 text-sm font-semibold px-2 py-1 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500/40 outline-none bg-indigo-50"
                                        />
                                        <button
                                            onClick={handleNameSave}
                                            disabled={savingName}
                                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                                            title="Save name"
                                        >
                                            <Check size={14} />
                                        </button>
                                        <button
                                            onClick={() => { setIsEditingName(false); setAccountName(account.name || ''); }}
                                            className="p-1 text-slate-400 hover:bg-white dark:bg-zinc-900 rounded-md transition-colors"
                                            title="Cancel"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 group">
                                        {accountName ? (
                                            <span className="text-base font-bold text-slate-900 dark:text-zinc-50">{accountName}</span>
                                        ) : (
                                            <span className="text-sm text-slate-400 italic">No nickname</span>
                                        )}
                                        <button
                                            onClick={() => setIsEditingName(true)}
                                            className="p-0.5 text-gray-300 hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity rounded"
                                            title="Edit nickname"
                                        >
                                            <Tag size={12} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Email address */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-sm font-medium text-slate-900 dark:text-zinc-400 truncate">{account.email}</h3>
                                <span className={`w-2 h-2 rounded-full shrink-0 ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            </div>

                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {/* Status badge */}
                                <span className={`text-xs font-semibold ${statusConfig.color}`}>
                                    {statusConfig.label}
                                </span>
                                {/* Auth method badge */}
                                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${authConfig.color}`}>
                                    {authConfig.icon}
                                    {authConfig.label}
                                </span>
                                {/* Admin: show user_id */}
                                {account.user_id && (
                                    <span className="text-xs text-slate-400">User #{account.user_id}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                        {needsReauth ? (
                            <button
                                onClick={handleReconnect}
                                disabled={reconnecting}
                                className={`text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                                    isAuthError
                                        ? 'text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100'
                                        : 'text-amber-600 bg-amber-50 border border-amber-200 hover:bg-amber-100'
                                }`}
                                title={isAuthError ? 'Token expired — click to re-authorize' : 'Complete OAuth authorization'}
                            >
                                <RefreshCw size={12} className={reconnecting ? 'animate-spin' : ''} />
                                {reconnecting ? 'Redirecting...' : isAuthError ? 'Re-authorize' : 'Connect OAuth'}
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={() => setIsEditing(!isEditing)}
                                    className={`p-2 rounded-lg transition-colors ${isEditing ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:bg-white dark:bg-zinc-900 hover:text-slate-600 dark:text-zinc-400'}`}
                                    title="Edit Signature"
                                >
                                    <Edit size={18} />
                                </button>

                                {account.status === 'active' || account.status === 'quota_limit' ? (
                                    <button
                                        onClick={() => { pauseAccount(account.id); router.refresh(); }}
                                        className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                                        title="Pause Account"
                                    >
                                        <Pause size={18} />
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => { activateAccount(account.id); router.refresh(); }}
                                        className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                                        title="Activate Account"
                                    >
                                        <Play size={18} />
                                    </button>
                                )}

                                <button
                                    onClick={() => { disconnectAccount(account.id); router.refresh(); }}
                                    className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg transition-colors"
                                    title="Disconnect"
                                >
                                    <Power size={18} />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Send Progress Bar */}
                <div className="mt-4 mb-2">
                    <div className="flex justify-between items-center text-xs text-slate-500 dark:text-zinc-400 mb-1.5">
                        <span className="font-semibold text-slate-700 dark:text-zinc-300">Daily Usage</span>
                        <div className="flex items-center gap-2">
                            {isEditingLimit ? (
                                <div className="flex items-center gap-1">
                                    <input
                                        type="number"
                                        value={limitValue}
                                        onChange={e => setLimitValue(e.target.value)}
                                        className="w-16 px-1.5 py-0.5 text-xs font-bold border rounded outline-none"
                                        autoFocus
                                        onKeyDown={e => e.key === 'Enter' && handleLimitSave()}
                                    />
                                    <button disabled={savingLimit} onClick={handleLimitSave} className="text-emerald-600 hover:bg-emerald-50 p-0.5 rounded"><Check size={12} /></button>
                                    <button onClick={() => { setIsEditingLimit(false); setLimitValue(account.daily_limit?.toString()); }} className="text-slate-400 hover:bg-slate-100 dark:bg-zinc-800/50 p-0.5 rounded"><X size={12} /></button>
                                </div>
                            ) : (
                                <span className="font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                                    {account.sent_today} / {account.daily_limit} ({sentPercent}%)
                                    <button onClick={() => setIsEditingLimit(true)} className="text-slate-400 hover:text-indigo-600"><Edit2 size={10} /></button>
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="w-full bg-white dark:bg-zinc-900 rounded-full h-1.5">
                        <div
                            className={`h-1.5 rounded-full transition-all duration-500 ${sentPercent >= 100 ? 'bg-rose-400' :
                                sentPercent > 75 ? 'bg-amber-400' :
                                    'bg-emerald-400'
                                }`}
                            style={{ width: `${sentPercent}%` }}
                        />
                    </div>
                </div>

                {/* Warmup info */}
                {account.warmup_enabled ? (
                    <div className="mt-3 text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded-lg px-3 py-1.5 flex items-center gap-2">
                        <span className="font-bold">🔥 Warmup Active</span>
                        <span className="text-slate-900 dark:text-zinc-400">Day {account.warmup_day || 1} · Health {account.warmup_health_score || 50}%</span>
                    </div>
                ) : null}

                {/* Signature Editor */}
                {isEditing && (
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-zinc-800">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-300 mb-1">Email Signature</label>
                        <p className="text-xs text-slate-400 dark:text-zinc-500 mb-2">
                            Use the toolbar to control font, size, color, and style — formatting carries over exactly to sent emails.
                        </p>
                        <div className="mb-3 rounded-xl overflow-hidden">
                            <RichTextEditor
                                value={signature}
                                onChange={setSignature}
                                placeholder={`Kind regards,\nYour Name\nYour Title`}
                                height="260px"
                                minHeight={150}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-4 py-2 text-slate-600 dark:text-zinc-400 hover:bg-white dark:bg-zinc-900 rounded-lg text-sm font-medium flex items-center gap-1"
                            >
                                <X size={14} /> Cancel
                            </button>
                            <button
                                onClick={handleSignatureSave}
                                disabled={saving}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold flex items-center gap-1 disabled:opacity-60"
                            >
                                <Save size={14} /> {saving ? 'Saving...' : 'Save Signature'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Signature preview */}
                {!isEditing && account.signature && (
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-zinc-800">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Signature Preview</p>
                        <div
                            className="bg-white dark:bg-zinc-900/60 p-3 rounded-lg border border-slate-200 dark:border-zinc-800 text-sm text-slate-600 dark:text-zinc-400"
                            dangerouslySetInnerHTML={{ __html: account.signature }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
