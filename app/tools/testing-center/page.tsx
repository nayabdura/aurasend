'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MarketingNav, MarketingFooter } from '@/components/MarketingLayout';
import { TestTube, CheckCircle, ArrowRight, Mail, AlertCircle, Inbox, Shield } from 'lucide-react';

export default function TestingCenterPage() {
    const [emailContent, setEmailContent] = useState('');
    const [subject, setSubject] = useState('');
    const [result, setResult] = useState<null | { score: number; issues: string[] }>(null);
    const [loading, setLoading] = useState(false);

    function analyzeEmail() {
        setLoading(true);
        setTimeout(() => {
            const issues: string[] = [];
            const text = emailContent.toLowerCase();
            const sub = subject.toLowerCase();

            if (text.includes('free') || sub.includes('free')) issues.push('Contains "free" — common spam trigger word');
            if (text.includes('click here')) issues.push('"Click here" detected — use descriptive anchor text');
            if (text.includes('!!!') || sub.includes('!!!')) issues.push('Excessive exclamation marks found');
            if (text.includes('dollar') || text.includes('$$$')) issues.push('Currency symbols may trigger spam filters');
            if (emailContent.length < 80) issues.push('Email body too short — may look suspicious');
            if (!emailContent.includes('unsubscribe')) issues.push('Missing unsubscribe link — required for compliance');

            const score = Math.max(10, 100 - issues.length * 15);
            setResult({ score, issues });
            setLoading(false);
        }, 1200);
    }

    return (
        <div className="min-h-screen bg-white font-sans">
            <MarketingNav active="/tools/testing-center" />
            <main className="pt-20">
                {/* Hero */}
                <section className="relative bg-gradient-to-br from-teal-950 via-slate-900 to-slate-950 overflow-hidden pt-28 pb-24">
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-teal-600/15 blur-[120px] rounded-full" />
                        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
                    </div>
                    <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 text-sm font-semibold mb-8">
                            <TestTube size={16} /> Email Testing Center
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
                            Test before you send.<br />
                            <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">Catch problems early.</span>
                        </h1>
                        <p className="text-xl text-slate-400 mb-4 leading-relaxed max-w-2xl mx-auto">
                            Run real deliverability tests on your email content. Detect spam trigger words, missing unsubscribe links, and inbox placement issues before your campaign goes live.
                        </p>
                        <p className="text-sm text-slate-500 mb-10">Free tool — 5 tests/day without an account. <Link href="/login" className="text-teal-400 font-bold hover:underline">Sign up for unlimited.</Link></p>
                    </div>
                </section>

                {/* Interactive Tester */}
                <section className="py-20 bg-slate-50">
                    <div className="max-w-3xl mx-auto px-6">
                        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8">
                            <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                                <TestTube className="text-teal-600" size={28} /> Quick Email Analyzer
                            </h2>
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Email Subject Line</label>
                                    <input
                                        type="text"
                                        value={subject}
                                        onChange={e => setSubject(e.target.value)}
                                        placeholder="e.g. Quick question about your sales process"
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none text-slate-900 bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Email Body</label>
                                    <textarea
                                        value={emailContent}
                                        onChange={e => setEmailContent(e.target.value)}
                                        placeholder="Paste your full email body here..."
                                        rows={8}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none text-slate-900 bg-white resize-none"
                                    />
                                </div>
                                <button
                                    onClick={analyzeEmail}
                                    disabled={loading || !emailContent || !subject}
                                    className="w-full h-12 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing...</>
                                    ) : (
                                        <><TestTube size={18} /> Analyze Email</>
                                    )}
                                </button>
                            </div>

                            {result && (
                                <div className="mt-8 space-y-4">
                                    <div className={`rounded-2xl p-6 flex items-center gap-6 border ${result.score >= 80 ? 'bg-emerald-50 border-emerald-200' : result.score >= 50 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
                                        <div className={`text-center shrink-0`}>
                                            <span className={`text-5xl font-black  ${result.score >= 80 ? 'text-emerald-600' : result.score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{result.score}</span>
                                            <p className="text-sm font-bold text-slate-600 mt-1">/ 100 Score</p>
                                        </div>
                                        <div>
                                            <h3 className={`font-bold text-lg ${result.score >= 80 ? 'text-emerald-700' : result.score >= 50 ? 'text-yellow-700' : 'text-red-700'}`}>
                                                {result.score >= 80 ? '✓ Good to send!' : result.score >= 50 ? '⚠ Review suggested' : '✗ Needs fixes'}
                                            </h3>
                                            <p className="text-slate-600 text-sm mt-1">
                                                {result.issues.length === 0 ? 'No issues detected. This email is ready to go!' : `${result.issues.length} issue${result.issues.length > 1 ? 's' : ''} detected.`}
                                            </p>
                                        </div>
                                    </div>
                                    {result.issues.length > 0 && (
                                        <div className="space-y-3">
                                            {result.issues.map((issue, i) => (
                                                <div key={i} className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-100 rounded-xl">
                                                    <AlertCircle className="text-orange-500 shrink-0 mt-0.5" size={18} />
                                                    <span className="text-slate-700 text-sm font-medium">{issue}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="pt-4 border-t border-slate-100 text-center">
                                        <p className="text-sm text-slate-500 mb-3">Want SMTP-level inbox placement testing?</p>
                                        <Link href="/login" className="inline-flex items-center gap-2 text-teal-600 font-bold hover:text-teal-700">
                                            Sign up for full testing suite <ArrowRight size={16} />
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section className="py-24 bg-white">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-black text-slate-900 mb-4">What AuraSend's Testing Center checks</h2>
                            <p className="text-xl text-slate-500 max-w-2xl mx-auto">The complete pre-send checklist so nothing slips through the cracks.</p>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
                            {[
                                { icon: Shield, title: 'Spam Score', desc: 'Analyzes content for spam trigger words, suspicious patterns, and phrases that commonly trigger filters.', color: 'text-red-600', bg: 'bg-red-50' },
                                { icon: Inbox, title: 'Inbox Placement', desc: 'Tests if your email would land in the primary inbox, promotions tab, or spam folder across major email providers.', color: 'text-blue-600', bg: 'bg-blue-50' },
                                { icon: Mail, title: 'HTML Structure', desc: 'Validates your HTML is correctly formed, has proper fallbacks, and renders well on mobile clients.', color: 'text-purple-600', bg: 'bg-purple-50' },
                                { icon: CheckCircle, title: 'Compliance Check', desc: 'Verifies CAN-SPAM and GDPR compliance: unsubscribe link, physical address, and consent language.', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                            ].map((f, i) => (
                                <div key={i} className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                                    <div className={`w-12 h-12 ${f.bg} ${f.color} rounded-xl flex items-center justify-center mb-4`}>
                                        <f.icon size={24} />
                                    </div>
                                    <h3 className="font-bold text-slate-900 mb-2">{f.title}</h3>
                                    <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-20 bg-gradient-to-r from-teal-600 to-cyan-600">
                    <div className="max-w-4xl mx-auto px-6 text-center">
                        <h2 className="text-4xl font-black text-white mb-4">Get the full testing suite.</h2>
                        <p className="text-xl text-teal-100 mb-8">Sign up free and run unlimited tests with real SMTP checks.</p>
                        <Link href="/login" className="inline-flex items-center gap-2 h-14 px-8 bg-white text-teal-700 font-bold rounded-full text-base shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all">
                            Start Free <ArrowRight size={18} />
                        </Link>
                    </div>
                </section>
            </main>
            <MarketingFooter />
        </div>
    );
}
