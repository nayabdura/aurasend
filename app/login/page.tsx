'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, Mail, Lock, User, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [userId, setUserId] = useState<number | null>(null);
    const [devOtp, setDevOtp] = useState<string | null>(null);
    const router = useRouter();

    async function handleVerification(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, code: otpCode })
            });

            let data: any = {};
            try {
                data = await res.json();
            } catch (_) {
                setError('Server error (500). Please try again.');
                setLoading(false);
                return;
            }

            if (!res.ok) {
                setError(data.error || 'Verification failed');
                setLoading(false);
                return;
            }

            setSuccess('Verified successfully! Redirecting...');
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 800);

        } catch (e: any) {
            setError(e.message || 'Network error');
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);
        setDevOtp(null);

        try {
            const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
            const body = mode === 'login'
                ? { email, password }
                : { email, password, name };

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            let data: any = {};
            try {
                data = await res.json();
            } catch (_) {
                setError('Server error (500). Please try again.');
                setLoading(false);
                return;
            }

            if (!res.ok) {
                setError(data.error || 'Authentication failed');
                setLoading(false);
                return;
            }

            if (data.requiresVerification) {
                setUserId(data.userId);
                setIsVerifying(true);
                if (data.devOtp) {
                    setDevOtp(data.devOtp);
                    setSuccess('SMTP Error: Verification bypassed for testing. See code below.');
                } else {
                    setSuccess('Verification code sent to your email.');
                }
                setLoading(false);
                return;
            }

            setTimeout(() => {
                if (data.user?.role === 'master') {
                    window.location.href = '/admin';
                } else {
                    window.location.href = '/dashboard';
                }
            }, 500);

        } catch (e: any) {
            setError(e.message || 'Network error. Please try again.');
            setLoading(false);
        }
    }

    // Shared input class — always dark so text is always visible
    const inputClass = `
        w-full py-3 rounded-xl outline-none transition-all
        bg-slate-800 border border-slate-700
        text-white placeholder-slate-500
        focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60
    `;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 mb-5">
                        <svg width="44" height="44" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: '22%', flexShrink: 0 }}>
                            <defs>
                                <linearGradient id="lb2" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#4F46E5" />
                                    <stop offset="100%" stopColor="#7C3AED" />
                                </linearGradient>
                                <linearGradient id="lbt2" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#60A5FA" />
                                    <stop offset="100%" stopColor="#A78BFA" />
                                </linearGradient>
                            </defs>
                            <rect width="100" height="100" rx="22" fill="url(#lb2)" />
                            <rect x="18" y="34" width="64" height="42" rx="6" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
                            <polyline points="18,40 50,60 82,40" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
                            <polygon points="55,20 43,50 52,50 45,80 63,44 53,44 60,20" fill="url(#lbt2)" opacity="0.95" />
                        </svg>
                        <span className="text-3xl font-black text-white tracking-tight">AuraSend</span>
                    </div>
                    <p className="text-slate-400 text-sm">
                        {mode === 'login' ? 'Welcome back! Sign in to your account.' : 'Create your account to get started.'}
                    </p>
                </div>

                {/* Card — always dark */}
                <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 rounded-3xl shadow-2xl p-8">
                    {/* Tab switcher */}
                    {!isVerifying && (
                        <div className="flex gap-1 mb-8 bg-slate-800/80 p-1 rounded-xl border border-slate-700/50">
                            <button
                                onClick={() => { setMode('login'); setError(''); }}
                                className={`flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all duration-200 ${
                                    mode === 'login'
                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                Login
                            </button>
                            <button
                                onClick={() => { setMode('signup'); setError(''); }}
                                className={`flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all duration-200 ${
                                    mode === 'signup'
                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                Sign Up
                            </button>
                        </div>
                    )}

                    {/* Verification header */}
                    {isVerifying && (
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-white mb-2">Check your email</h2>
                            <p className="text-slate-400 text-sm mb-4">We sent a 6-digit confirmation code to <span className="text-blue-400">{email}</span></p>
                            {devOtp && (
                                <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4 text-blue-200 text-sm mt-4">
                                    <strong className="block text-white mb-1">Development Notice</strong>
                                    Google blocked the real email. Use this code for testing:<br />
                                    <span className="text-2xl font-black tracking-widest text-white mt-2 block">{devOtp}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Error & Success Alerts */}
                    {error && (
                        <div className="mb-5 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 text-red-400">
                            <AlertCircle size={18} className="mt-0.5 shrink-0" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}
                    {success && (
                        <div className="mb-5 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3 text-green-400">
                            <CheckCircle size={18} className="shrink-0" />
                            <span className="text-sm">{success}</span>
                        </div>
                    )}

                    {isVerifying ? (
                        <form onSubmit={handleVerification} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">6-Digit Code</label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <input
                                        type="text"
                                        maxLength={6}
                                        value={otpCode}
                                        onChange={(e) => setOtpCode(e.target.value)}
                                        className={`${inputClass} pl-11 pr-4 tracking-widest text-center text-xl font-mono`}
                                        placeholder="000000"
                                        required
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading || otpCode.length < 6}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-900/30 mt-2"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <CheckCircle size={18} />
                                )}
                                Verify Account
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsVerifying(false)}
                                className="w-full mt-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                            >
                                Back to Sign Up
                            </button>
                        </form>
                    ) : (
                        <>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {mode === 'signup' && (
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-300 mb-2">Full Name</label>
                                        <div className="relative">
                                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                            <input
                                                type="text"
                                                id="name"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className={`${inputClass} pl-11 pr-4`}
                                                placeholder="Your Name"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-semibold text-slate-300 mb-2">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                        <input
                                            type="email"
                                            id="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className={`${inputClass} pl-11 pr-4`}
                                            placeholder="you@example.com"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-300 mb-2">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            id="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className={`${inputClass} pl-11 pr-12`}
                                            placeholder="••••••••"
                                            required
                                            minLength={6}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    id="submit-btn"
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-900/30 mt-2"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <LogIn size={18} />
                                    )}
                                    {loading ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
                                </button>
                            </form>

                            {/* Divider */}
                            <div className="flex items-center gap-3 my-6">
                                <div className="flex-1 h-px bg-slate-700" />
                                <span className="text-slate-500 text-xs font-medium">OR</span>
                                <div className="flex-1 h-px bg-slate-700" />
                            </div>

                            {/* Google Sign-In Button */}
                            <button
                                id="google-signin-btn"
                                type="button"
                                onClick={() => {
                                    setError('');
                                    window.location.href = '/api/auth/google';
                                }}
                                className="w-full flex items-center justify-center gap-3 py-3.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-white rounded-xl font-semibold text-sm transition-all duration-200"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Continue with Google
                            </button>
                        </>
                    )}

                    <p className="text-center text-xs text-slate-600 mt-4">
                        Google Sign-In requires configuration in Settings.{' '}
                        <span className="text-slate-500">Use email/password for now.</span>
                    </p>
                </div>

                <p className="text-center text-xs text-slate-600 mt-6">
                    By continuing, you agree to our Terms of Service and Privacy Policy.
                </p>
            </div>
        </div>
    );
}
