'use client';

import { useState } from 'react';
import { Plus, Mail, Key, Lock, ExternalLink, Info, CheckCircle, AlertCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

type AuthMethod = 'oauth' | 'app_password' | 'smtp';

export default function AddAccountForm() {
    const [authMethod, setAuthMethod] = useState<AuthMethod>('oauth');
    const [email, setEmail] = useState('');
    const [accountNickname, setAccountNickname] = useState('');
    const [useDefaultOAuth, setUseDefaultOAuth] = useState(true);
    const [clientId, setClientId] = useState('');
    const [clientSecret, setClientSecret] = useState('');
    const [appPassword, setAppPassword] = useState('');
    const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
    const [smtpPort, setSmtpPort] = useState('587');
    const [dailyLimit, setDailyLimit] = useState('20');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            if (authMethod === 'oauth') {
                const bodyPayload: any = { email, name: accountNickname.trim() || undefined, dailyLimit: parseInt(dailyLimit) };
                if (!useDefaultOAuth) {
                    bodyPayload.clientId = clientId;
                    bodyPayload.clientSecret = clientSecret;
                }
                const res = await fetch('/api/gmail/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bodyPayload)
                });

                const data = await res.json();
                if (res.ok && data.url) {
                    setMessage({ type: 'success', text: 'Redirecting to Google to authorize your account...' });
                    setTimeout(() => { window.location.href = data.url; }, 800);
                } else {
                    setMessage({ type: 'error', text: data.error || 'Failed to initiate OAuth. Check environment variables.' });
                }
            } else {
                const res = await fetch('/api/gmail/add-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email,
                        name: accountNickname.trim() || undefined,
                        authMethod,
                        appPassword,
                        smtpHost: smtpHost || 'smtp.gmail.com',
                        smtpPort: parseInt(smtpPort) || 587,
                        dailyLimit: parseInt(dailyLimit)
                    })
                });

                const data = await res.json();
                if (res.ok) {
                    setMessage({ type: 'success', text: `Gmail account connected via ${authMethod === 'app_password' ? 'App Password' : 'SMTP'}!` });
                    setEmail('');
                    setAppPassword('');
                    router.refresh();
                } else {
                    setMessage({ type: 'error', text: data.error || 'Failed to add account' });
                }
            }
        } catch (e) {
            setMessage({ type: 'error', text: 'Network error. Please check your connection and try again.' });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="bg-white dark:bg-zinc-900/60 rounded-2xl shadow-lg border border-slate-200 dark:border-zinc-800 dark:border-zinc-800 overflow-hidden mb-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Plus size={22} />
                    Connect Gmail Account
                </h2>
                <p className="text-blue-100 text-sm mt-1">Add your Gmail account to start sending cold emails</p>
            </div>

            <div className="p-6">

                {/* Message */}
                {message && (
                    <div className={`mb-5 p-4 rounded-xl flex items-start gap-3 border text-sm ${message.type === 'error'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : 'bg-green-50 text-green-700 border-green-200'
                        }`}>
                        {message.type === 'error'
                            ? <AlertCircle size={16} className="shrink-0 mt-0.5" />
                            : <CheckCircle size={16} className="shrink-0 mt-0.5" />}
                        <span>{message.text}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Email (always shown) */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-50 mb-2">Gmail Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="yourname@gmail.com"
                            required
                        />
                    </div>

                    {/* Nickname */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-50 mb-2">
                            Account Nickname
                            <span className="ml-2 text-xs font-normal text-gray-400">(optional — helps you identify this account)</span>
                        </label>
                        <input
                            type="text"
                            value={accountNickname}
                            onChange={(e) => setAccountNickname(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="e.g. Sales Outreach, Personal, Company Main..."
                        />
                    </div>

                    {/* Auth Method Tabs */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-50 mb-3">Authentication Method</label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setAuthMethod('oauth')}
                                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 font-medium text-xs transition-all ${authMethod === 'oauth'
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-slate-200 dark:border-zinc-800 dark:border-zinc-800 text-slate-500 dark:text-zinc-50 hover:border-slate-300 dark:border-zinc-700'
                                    }`}
                            >
                                {/* Google Icon */}
                                <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                <span>Sign in with Google</span>
                                <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-bold">Recommended</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setAuthMethod('app_password')}
                                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 font-medium text-xs transition-all ${authMethod === 'app_password'
                                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                                    : 'border-slate-200 dark:border-zinc-800 dark:border-zinc-800 text-slate-500 dark:text-zinc-50 hover:border-slate-300 dark:border-zinc-700'
                                    }`}
                            >
                                <Key size={20} className={authMethod === 'app_password' ? 'text-purple-600' : 'text-gray-400'} />
                                <span>App Password</span>
                                <span className="text-[10px] text-gray-400">No OAuth needed</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setAuthMethod('smtp')}
                                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 font-medium text-xs transition-all ${authMethod === 'smtp'
                                    ? 'border-gray-600 bg-slate-50 dark:bg-zinc-900/50 dark:bg-zinc-900/30 text-slate-700 dark:text-zinc-50'
                                    : 'border-slate-200 dark:border-zinc-800 dark:border-zinc-800 text-slate-500 dark:text-zinc-50 hover:border-slate-300 dark:border-zinc-700'
                                    }`}
                            >
                                <Lock size={20} className={authMethod === 'smtp' ? 'text-slate-600 dark:text-zinc-50' : 'text-gray-400'} />
                                <span>SMTP</span>
                                <span className="text-[10px] text-gray-400">Custom Server</span>
                            </button>
                        </div>
                    </div>

                    {/* OAuth Method Content */}
                    {authMethod === 'oauth' && (
                        <div className="space-y-3">
                            {/* Main Google Button */}
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                <div className="flex items-center gap-2 text-blue-700 text-sm font-medium mb-1">
                                    <CheckCircle size={15} className="text-blue-500" />
                                    Using system Google OAuth credentials
                                </div>
                                <p className="text-xs text-blue-600">
                                    Enter your Gmail address above, set a daily limit below, then click "Connect with Google" to authorize.
                                </p>
                            </div>

                            {/* Toggle for custom credentials */}
                            <button
                                type="button"
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-50 hover:text-slate-700 dark:text-zinc-50 font-medium transition-colors"
                            >
                                {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                {showAdvanced ? 'Hide' : 'Use custom OAuth credentials instead'}
                            </button>

                            {showAdvanced && (
                                <div className="space-y-3 pt-1">
                                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                        <Info size={14} className="text-amber-500 shrink-0 mt-0.5" />
                                        <p className="text-xs text-amber-700">
                                            Provide your own Google Cloud OAuth credentials. Leave blank to use the system default.
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-50 mb-1.5">Custom Client ID</label>
                                        <input
                                            type="text"
                                            value={clientId}
                                            onChange={(e) => { setClientId(e.target.value); setUseDefaultOAuth(!e.target.value); }}
                                            className="w-full px-3 py-2.5 border border-slate-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
                                            placeholder="xxxx.apps.googleusercontent.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-50 mb-1.5">Custom Client Secret</label>
                                        <input
                                            type="password"
                                            value={clientSecret}
                                            onChange={(e) => { setClientSecret(e.target.value); setUseDefaultOAuth(!e.target.value); }}
                                            className="w-full px-3 py-2.5 border border-slate-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
                                            placeholder="GOCSPX-..."
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* App Password */}
                    {authMethod === 'app_password' && (
                        <div className="space-y-3">
                            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex gap-2">
                                <Info size={14} className="text-purple-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-purple-700">
                                    Enable Gmail 2-Step Verification, then generate a 16-character App Password at{' '}
                                    <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer"
                                        className="underline font-semibold">myaccount.google.com/apppasswords</a>.
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-50 mb-2">
                                    App Password
                                    <span className="ml-2 text-xs font-normal text-slate-500 dark:text-zinc-50">(16 characters)</span>
                                </label>
                                <input
                                    type="password"
                                    value={appPassword}
                                    onChange={(e) => setAppPassword(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all font-mono tracking-wider"
                                    placeholder="xxxx xxxx xxxx xxxx"
                                    required
                                />
                                <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer"
                                    className="mt-2 text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium">
                                    <ExternalLink size={11} />
                                    Generate App Password at Google Account
                                </a>
                            </div>
                        </div>
                    )}

                    {/* SMTP Fields */}
                    {authMethod === 'smtp' && (
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-50 mb-2">Password</label>
                                <input
                                    type="password"
                                    value={appPassword}
                                    onChange={(e) => setAppPassword(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="Gmail password or app password"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-50 mb-2">SMTP Host</label>
                                    <input
                                        type="text"
                                        value={smtpHost}
                                        onChange={(e) => setSmtpHost(e.target.value)}
                                        className="w-full px-4 py-3 border border-slate-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="smtp.gmail.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-50 mb-2">SMTP Port</label>
                                    <select
                                        value={smtpPort}
                                        onChange={(e) => setSmtpPort(e.target.value)}
                                        className="w-full px-4 py-3 border border-slate-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-zinc-900/60"
                                    >
                                        <option value="587">587 (STARTTLS)</option>
                                        <option value="465">465 (SSL)</option>
                                        <option value="25">25 (Legacy)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Daily Limit */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-50 mb-2">
                            Daily Send Limit
                            <span className="ml-2 text-xs font-normal text-gray-400">(20–50 recommended for new accounts)</span>
                        </label>
                        <input
                            type="number"
                            value={dailyLimit}
                            onChange={(e) => setDailyLimit(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="20"
                            min="1"
                            max="500"
                        />
                    </div>

                    {/* Submit Button */}
                    {authMethod === 'oauth' ? (
                        <button
                            type="submit"
                            disabled={loading || !email}
                            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white dark:bg-zinc-900/60 hover:bg-slate-50 dark:bg-zinc-900/50 dark:bg-zinc-900/30 border-2 border-slate-300 dark:border-zinc-700 hover:border-gray-400 text-slate-700 dark:text-zinc-50 rounded-xl font-semibold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <Loader2 size={20} className="animate-spin text-blue-600" />
                            ) : (
                                <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                            )}
                            <span>{loading ? 'Connecting to Google...' : 'Connect with Google'}</span>
                        </button>
                    ) : (
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                            {loading ? 'Connecting...' : 'Add Gmail Account'}
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
}
