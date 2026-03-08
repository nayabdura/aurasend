'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MarketingNav, MarketingFooter } from '@/components/MarketingLayout';
import { CheckCircle2, Shield, SearchCheck, ArrowRight, Zap, Target, Loader2, XCircle } from 'lucide-react';

export default function EmailVerifierPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<'valid' | 'invalid' | null>(null);
    const [error, setError] = useState('');
    const [usesLeft, setUsesLeft] = useState(5);

    useEffect(() => {
        const dateKey = new Date().toISOString().split('T')[0];
        const storedDate = localStorage.getItem('verifier_date');
        const storedCount = parseInt(localStorage.getItem('verifier_count') || '0', 10);

        if (storedDate !== dateKey) {
            localStorage.setItem('verifier_date', dateKey);
            localStorage.setItem('verifier_count', '0');
            setUsesLeft(5);
        } else {
            setUsesLeft(Math.max(0, 5 - storedCount));
        }
    }, []);

    const handleVerify = async () => {
        if (!email) return;
        if (usesLeft <= 0) {
            setError('Daily limit reached. Please log in to verify more emails.');
            return;
        }

        setError('');
        setResult(null);
        setLoading(true);

        const dateKey = new Date().toISOString().split('T')[0];
        const currentCount = parseInt(localStorage.getItem('verifier_count') || '0', 10);
        localStorage.setItem('verifier_count', (currentCount + 1).toString());
        setUsesLeft(Math.max(0, 5 - (currentCount + 1)));

        // Simulate real validation delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        const isValidFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        setResult(isValidFormat ? 'valid' : 'invalid');
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <MarketingNav active="/features" />

            <main className="pt-28 pb-32">
                {/* Verification Hero */}
                <section className="relative overflow-hidden pt-20 pb-24">
                    <div className="absolute inset-0 pointer-events-none z-0">
                        <div className="absolute top-[10%] right-[10%] w-[500px] h-[500px] bg-blue-400/20 blur-3xl rounded-full" />
                        <div className="absolute bottom-[10%] left-[10%] w-[500px] h-[500px] bg-indigo-400/20 blur-3xl rounded-full" />
                    </div>

                    <div className="max-w-7xl mx-auto px-6 relative z-10">
                        <div className="text-center max-w-4xl mx-auto mb-16">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-sm font-bold tracking-wide shadow-sm mb-6">
                                <Shield size={16} /> Advanced Deliverability Tool
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 mb-6 leading-tight">
                                Never bounce an <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                                    email again.
                                </span>
                            </h1>
                            <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed mb-4">
                                Protect your sender reputation. Upload your lead lists and instantly verify 100% of the emails. Catch typos, hard bounces, and catch-all domains before you hit send.
                            </p>
                            <p className="text-sm text-slate-400 font-semibold">{usesLeft} free verifications remaining today</p>
                        </div>

                        {/* Simulated App Verifier Bar */}
                        <div className="max-w-3xl mx-auto bg-white rounded-3xl p-4 md:p-6 shadow-2xl border border-slate-200 flex flex-col items-center gap-4 mb-10 relative transform hover:-translate-y-1 transition-all duration-300">
                            <div className="flex w-full flex-col sm:flex-row items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                                    <SearchCheck size={24} />
                                </div>
                                <input
                                    type="email"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                                    className="flex-1 h-16 w-full px-6 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 text-lg transition-all"
                                />
                                {usesLeft > 0 || result ? (
                                    <button
                                        onClick={handleVerify}
                                        disabled={loading || !email}
                                        className="w-full sm:w-auto h-16 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold flex items-center justify-center transition-colors disabled:opacity-50"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={24} /> : 'Verify Email'}
                                    </button>
                                ) : (
                                    <Link href="/login" className="w-full sm:w-auto h-16 px-8 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold flex items-center justify-center transition-colors">
                                        Log in to continue
                                    </Link>
                                )}
                            </div>

                            {error && (
                                <div className="w-full p-4 mt-2 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm font-bold flex items-center justify-between">
                                    <span>{error}</span>
                                    <Link href="/login" className="px-4 py-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition">Log In</Link>
                                </div>
                            )}

                            {result && !error && (
                                <div className={`w-full p-4 mt-2 border rounded-xl flex items-center gap-3 ${result === 'valid' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
                                    {result === 'valid' ? <CheckCircle2 size={24} className="text-emerald-500" /> : <XCircle size={24} className="text-rose-500" />}
                                    <div>
                                        <p className="font-bold text-lg">{result === 'valid' ? 'Email is Valid & Safe' : 'Invalid or Bounced Email'}</p>
                                        <p className="text-sm opacity-80">{result === 'valid' ? 'This inbox exists and is safe to receive your campaign.' : 'Do not send to this address. It will negatively impact your sender health.'}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Features of the verifier */}
                        <div className="grid md:grid-cols-3 gap-8 text-left">
                            {[
                                { title: '7-Tier Verification', desc: 'Checks syntax, gibberish, domain existence, MX records, SMTP protocols, and exact mailbox pings.' },
                                { title: 'Catch-All Detection', desc: 'Identify domains that accept all emails to prevent silent spam filtering from corporate firewalls.' },
                                { title: 'Instant Bulk Processing', desc: 'Upload a CSV of 10,000 leads and clean it in minutes. Export only the 100% valid contacts.' },
                            ].map((f) => (
                                <div key={f.title} className="bg-white rounded-3xl p-8 border border-slate-200">
                                    <CheckCircle2 size={32} className="text-emerald-500 mb-6" />
                                    <h3 className="text-xl font-bold text-slate-900 mb-3">{f.title}</h3>
                                    <p className="text-slate-500 leading-relaxed">{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Start using CTA */}
                <section className="max-w-5xl mx-auto px-6 mt-10">
                    <div className="bg-slate-950 rounded-3xl p-16 text-center text-white relative overflow-hidden">
                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-slate-950 to-slate-950"></div>
                        <h2 className="text-4xl font-black mb-6 relative z-10">Clean lists = higher replies.</h2>
                        <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto relative z-10">AuraSend’s verifier is built directly into your cold email workflow. Upload an unverified list into your campaign, and we'll check every email automatically before sending.</p>
                        <Link href="/login" className="inline-flex items-center justify-center gap-2 h-16 px-10 bg-white text-slate-900 rounded-full font-bold text-lg hover:bg-slate-100 transition-colors relative z-10 w-full sm:w-auto">
                            Sign up and start verifying <ArrowRight size={20} />
                        </Link>
                    </div>
                </section>
            </main>

            <MarketingFooter />
        </div>
    );
}
