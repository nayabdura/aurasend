'use client';

import Link from 'next/link';
import { MarketingNav, MarketingFooter } from '@/components/MarketingLayout';
import { Shield, CheckCircle, ArrowRight, Zap, TrendingUp, Star, Globe2, Mail, BarChart2 } from 'lucide-react';

export default function EmailWarmupPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-zinc-900/60 font-sans">
            <MarketingNav active="/tools/email-warmup" />

            <main className="pt-20">
                {/* Hero */}
                <section className="relative bg-gradient-to-br from-purple-950 via-slate-900 to-slate-950 overflow-hidden pt-28 pb-24">
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-purple-600/15 blur-[120px] rounded-full" />
                        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/10 blur-[100px] rounded-full" />
                        {/* Grid pattern */}
                        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
                    </div>
                    <div className="max-w-7xl mx-auto px-6 relative z-10">
                        <div className="flex flex-col lg:flex-row items-center gap-16">
                            <div className="flex-1 text-center lg:text-left">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm font-semibold mb-8">
                                    <Shield size={16} /> Email Warmup Tool
                                </div>
                                <h1 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
                                    Build a sending reputation.<br />
                                    <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Never land in spam.</span>
                                </h1>
                                <p className="text-xl text-slate-400 mb-10 leading-relaxed max-w-2xl">
                                    AuraSend's email warmup tool gradually increases your sending volume while simulating real human interactions — opens, replies, and positive engagements — that signal to Gmail, Outlook, and Yahoo that you're a trusted sender.
                                </p>
                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                    <Link href="/login" className="h-14 px-8 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-full font-bold text-base flex items-center gap-2 shadow-xl shadow-purple-900/40 transition-all transform hover:-translate-y-1">
                                        Start Warming Up Free <ArrowRight size={18} />
                                    </Link>
                                    <p className="text-slate-400 text-sm">No credit card needed</p>
                                </div>
                            </div>
                            {/* Visual card */}
                            <div className="flex-1 w-full max-w-lg">
                                <div className="bg-white dark:bg-zinc-900 backdrop-blur border border-white/10 rounded-3xl p-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-white font-bold text-lg">Warmup Progress</h3>
                                        <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-full text-xs font-bold">Active</span>
                                    </div>
                                    <div className="space-y-5">
                                        {[
                                            { label: 'Inbox Placement', val: 98, color: 'bg-emerald-500' },
                                            { label: 'Domain Reputation', val: 94, color: 'bg-purple-500' },
                                            { label: 'Warmup Score', val: 87, color: 'bg-indigo-500' },
                                        ].map((item) => (
                                            <div key={item.label}>
                                                <div className="flex justify-between text-sm mb-2">
                                                    <span className="text-slate-300 font-medium">{item.label}</span>
                                                    <span className="text-white font-bold">{item.val}%</span>
                                                </div>
                                                <div className="w-full h-2 bg-white dark:bg-zinc-900 rounded-full overflow-hidden">
                                                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.val}%` }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-6 grid grid-cols-3 gap-4">
                                        {[
                                            { label: 'Day', val: '14' },
                                            { label: 'Sent Today', val: '42' },
                                            { label: 'Inbox %', val: '98%' },
                                        ].map((s) => (
                                            <div key={s.label} className="bg-white dark:bg-zinc-900 rounded-xl p-3 text-center border border-white/10">
                                                <span className="block text-xl font-black text-white">{s.val}</span>
                                                <span className="text-xs text-slate-400">{s.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How it works */}
                <section className="py-24 bg-slate-50 dark:bg-zinc-900/50">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-black text-slate-900 dark:text-zinc-50 mb-4">How Email Warmup Works</h2>
                            <p className="text-xl text-slate-500 dark:text-zinc-400 max-w-2xl mx-auto">Your sending reputation builds daily, silently, while you focus on what matters.</p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                { icon: Mail, title: 'Connect Your Inbox', desc: 'Link your Gmail, Outlook, or custom SMTP account. We support unlimited accounts in parallel for faster scaling.', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
                                { icon: Zap, title: 'Automated Interactions', desc: 'Our system exchanges emails with a network of warm, trusted inboxes. Emails are opened, starred, and replied to — exactly like a real human would.', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
                                { icon: TrendingUp, title: 'Watch Your Score Rise', desc: 'The daily send volume gradually increases (from 10 → 50+ emails/day) while your spam rate drops to 0%. Track every metric in real-time on your dashboard.', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
                            ].map((step, i) => (
                                <div key={i} className={`bg-white dark:bg-zinc-900/60 rounded-3xl p-8 border ${step.border} shadow-sm hover:shadow-lg transition-shadow`}>
                                    <div className={`w-14 h-14 ${step.bg} ${step.color} rounded-2xl flex items-center justify-center mb-6`}>
                                        <step.icon size={28} />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-zinc-50 mb-3">{step.title}</h3>
                                    <p className="text-slate-500 dark:text-zinc-400 leading-relaxed">{step.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Features List */}
                <section className="py-24 bg-white dark:bg-zinc-900/60">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <div>
                                <h2 className="text-4xl font-black text-slate-900 dark:text-zinc-50 mb-6">Everything you need to build a bulletproof sender reputation</h2>
                                <p className="text-lg text-slate-500 dark:text-zinc-400 mb-10 leading-relaxed">
                                    Cold outreach only works if your emails actually arrive in the inbox. AuraSend's warmup engine ensures your domain is fully trusted before your campaigns even start — and keeps it healthy as you scale.
                                </p>
                                <ul className="space-y-5">
                                    {[
                                        'Supports Gmail, Outlook, and any custom SMTP',
                                        'Peer-to-peer warmup network with real accounts',
                                        'Automatic reply simulation to build engagement',
                                        'Gradual sending ramp (10 → 500 emails/day)',
                                        'Daily health reports and spam placement monitoring',
                                        'Emergency pause if spam rate spikes',
                                        'Multi-account management from a single dashboard',
                                    ].map((f, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <CheckCircle className="text-emerald-500 shrink-0 mt-0.5" size={20} />
                                            <span className="text-slate-700 dark:text-zinc-300 font-medium">{f}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="bg-gradient-to-br from-purple-900 to-slate-900 rounded-3xl p-8 text-white">
                                <h3 className="font-bold text-lg mb-6">Sending Health Timeline</h3>
                                <div className="space-y-3">
                                    {[
                                        { day: 'Day 1', sent: 12, inbox: 83, label: 'Getting started' },
                                        { day: 'Day 7', sent: 28, inbox: 91, label: 'Building trust' },
                                        { day: 'Day 14', sent: 55, inbox: 97, label: 'Good reputation' },
                                        { day: 'Day 30', sent: 120, inbox: 99, label: 'Excellent' },
                                    ].map((row) => (
                                        <div key={row.day} className="flex items-center gap-4 bg-white dark:bg-zinc-900 rounded-xl px-4 py-3 border border-white/10">
                                            <span className="text-slate-400 text-sm w-14 shrink-0 font-medium">{row.day}</span>
                                            <div className="flex-1 h-2 bg-white dark:bg-zinc-900 rounded-full overflow-hidden">
                                                <div className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full" style={{ width: `${row.inbox}%` }} />
                                            </div>
                                            <span className="text-white font-bold text-sm w-10 shrink-0">{row.inbox}%</span>
                                            <span className="text-slate-400 text-xs w-24 shrink-0">{row.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-20 bg-gradient-to-r from-purple-600 to-indigo-600">
                    <div className="max-w-4xl mx-auto px-6 text-center">
                        <h2 className="text-4xl font-black text-white mb-4">Ready to protect your sender reputation?</h2>
                        <p className="text-xl text-purple-200 mb-8">Start warming up for free. No credit card required.</p>
                        <Link href="/login" className="inline-flex items-center gap-2 h-14 px-8 bg-white dark:bg-zinc-900/60 text-purple-700 font-bold rounded-full text-base shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all">
                            Get Started Free <ArrowRight size={18} />
                        </Link>
                    </div>
                </section>
            </main>

            <MarketingFooter />
        </div>
    );
}
