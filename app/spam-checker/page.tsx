'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MarketingNav, MarketingFooter } from '@/components/MarketingLayout';
import { ShieldAlert, AlertTriangle, ShieldCheck, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function SpamCheckerPage() {
    const [emailContent, setEmailContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ score: number, words: string[] } | null>(null);
    const [error, setError] = useState('');
    const [usesLeft, setUsesLeft] = useState(5);

    useEffect(() => {
        const dateKey = new Date().toISOString().split('T')[0];
        const storedDate = localStorage.getItem('spamcheck_date');
        const storedCount = parseInt(localStorage.getItem('spamcheck_count') || '0', 10);

        if (storedDate !== dateKey) {
            localStorage.setItem('spamcheck_date', dateKey);
            localStorage.setItem('spamcheck_count', '0');
            setUsesLeft(5);
        } else {
            setUsesLeft(Math.max(0, 5 - storedCount));
        }
    }, []);

    const handleCheck = async () => {
        if (!emailContent) return;
        if (usesLeft <= 0) {
            setError('Daily limit reached. Please log in to check more emails.');
            return;
        }

        setError('');
        setResult(null);
        setLoading(true);

        const dateKey = new Date().toISOString().split('T')[0];
        const currentCount = parseInt(localStorage.getItem('spamcheck_count') || '0', 10);
        localStorage.setItem('spamcheck_count', (currentCount + 1).toString());
        setUsesLeft(Math.max(0, 5 - (currentCount + 1)));

        // Simulate real validation delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        const triggerWords = ['free', 'guarantee', 'urgent', 'winner', 'money', 'cash', 'credit', 'buy', 'now', 'act', 'limited', 'offer'];
        const foundWords = triggerWords.filter(w => emailContent.toLowerCase().includes(w));
        const baseScore = Math.max(0, 100 - (foundWords.length * 15));

        setResult({ score: baseScore, words: foundWords });
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <MarketingNav active="/features" />

            <main className="pt-28 pb-32">
                <section className="relative overflow-hidden pt-20 pb-24">
                    <div className="absolute inset-0 pointer-events-none z-0">
                        <div className="absolute top-[10%] right-[10%] w-[500px] h-[500px] bg-purple-400/20 blur-3xl rounded-full" />
                        <div className="absolute bottom-[10%] left-[10%] w-[500px] h-[500px] bg-indigo-400/20 blur-3xl rounded-full" />
                    </div>

                    <div className="max-w-7xl mx-auto px-6 relative z-10">
                        <div className="text-center max-w-4xl mx-auto mb-16">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-sm font-bold tracking-wide shadow-sm mb-6">
                                <ShieldAlert size={16} /> Content Reputation Tool
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 mb-6 leading-tight">
                                Don&apos;t end up in the <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                                    Spam Folder.
                                </span>
                            </h1>
                            <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed mb-4">
                                Test your email copy before sending. Our spam checker scans your content against the latest ISP filters to score your likelihood of reaching the primary inbox.
                            </p>
                            <p className="text-sm text-slate-400 font-semibold">{usesLeft} free checks remaining today</p>
                        </div>

                        <div className="max-w-3xl mx-auto bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 flex flex-col gap-4 mb-10 relative transform hover:-translate-y-1 transition-all duration-300">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                                    <ShieldAlert size={24} />
                                </div>
                                <h3 className="font-bold text-lg text-slate-900">Paste your email copy</h3>
                            </div>

                            <textarea
                                placeholder="Hi {{First Name}},\n\nI wanted to reach out because..."
                                value={emailContent}
                                onChange={(e) => setEmailContent(e.target.value)}
                                className="w-full h-48 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 text-base transition-all resize-none"
                            />

                            <div className="flex justify-end">
                                {usesLeft > 0 || result ? (
                                    <button
                                        onClick={handleCheck}
                                        disabled={loading || !emailContent}
                                        className="h-14 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold flex items-center justify-center transition-colors disabled:opacity-50"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={24} /> : 'Check Spam Score'}
                                    </button>
                                ) : (
                                    <Link href="/login" className="h-14 px-8 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold flex items-center justify-center transition-colors">
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
                                <div className={`w-full p-6 mt-4 border rounded-2xl ${result.score > 80 ? 'bg-emerald-50 border-emerald-100' : result.score > 50 ? 'bg-amber-50 border-amber-100' : 'bg-rose-50 border-rose-100'}`}>
                                    <div className="flex flex-col md:flex-row gap-6 items-center">
                                        <div className="shrink-0 flex items-center justify-center relative w-24 h-24">
                                            <svg className="absolute w-24 h-24" viewBox="0 0 36 36">
                                                <path className="text-slate-200" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                                <path className={result.score > 80 ? 'text-emerald-500' : result.score > 50 ? 'text-amber-500' : 'text-rose-500'} strokeDasharray={`${result.score}, 100`} strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                            </svg>
                                            <span className="absolute text-xl font-black text-slate-900">{result.score}</span>
                                        </div>
                                        <div className="flex-1 text-center md:text-left">
                                            <p className={`font-black text-2xl mb-2 ${result.score > 80 ? 'text-emerald-700' : result.score > 50 ? 'text-amber-700' : 'text-rose-700'}`}>
                                                {result.score > 80 ? 'Excellent Deliverability' : result.score > 50 ? 'Moderate Spam Risk' : 'High Spam Risk'}
                                            </p>
                                            {result.words.length > 0 ? (
                                                <p className="text-sm text-slate-700 font-medium">Trigger words detected: <strong className="text-rose-600 uppercase tracking-widest">{result.words.join(', ')}</strong>. Consider replacing these to improve your score.</p>
                                            ) : (
                                                <p className="text-sm text-slate-700 font-medium tracking-wide">Awesome! No major spam trigger words detected in your copy.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                </section>

                <section className="max-w-5xl mx-auto px-6 mt-10">
                    <div className="bg-slate-950 rounded-3xl p-16 text-center text-white relative overflow-hidden">
                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-500 via-slate-950 to-slate-950"></div>
                        <h2 className="text-4xl font-black mb-6 relative z-10">Avoid the Promotions tab.</h2>
                        <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto relative z-10">Checking your content is only half the battle. Sign up for AuraSend to automatically monitor inbox health, rotate sending IP's, and perform automated email warmups.</p>
                        <Link href="/login" className="inline-flex items-center justify-center gap-2 h-16 px-10 bg-white text-slate-900 rounded-full font-bold text-lg hover:bg-slate-100 transition-colors relative z-10 w-full sm:w-auto">
                            Start for free <ArrowRight size={20} />
                        </Link>
                    </div>
                </section>
            </main>

            <MarketingFooter />
        </div>
    );
}
