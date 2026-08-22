'use client';

import Link from 'next/link';
import { MarketingNav, MarketingFooter } from '@/components/MarketingLayout';
import { Zap, CheckCircle, ArrowRight, GitBranch, Clock, BarChart2, Target, Edit3, RefreshCw } from 'lucide-react';

export default function CampaignsToolPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-zinc-900/60 font-sans">
            <MarketingNav active="/tools/campaigns" />
            <main className="pt-20">
                {/* Hero */}
                <section className="relative bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 overflow-hidden pt-28 pb-24">
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-indigo-600/15 blur-[120px] rounded-full" />
                        <div className="absolute -bottom-20 left-0 w-[500px] h-[500px] bg-blue-600/10 blur-[100px] rounded-full" />
                        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
                    </div>
                    <div className="max-w-7xl mx-auto px-6 relative z-10">
                        <div className="flex flex-col lg:flex-row items-center gap-16">
                            <div className="flex-1 text-center lg:text-left">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm font-semibold mb-8">
                                    <Zap size={16} /> Drip Campaign Builder
                                </div>
                                <h1 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
                                    Build sequences that<br />
                                    <span className="bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">close deals on autopilot.</span>
                                </h1>
                                <p className="text-xl text-slate-400 mb-10 leading-relaxed max-w-2xl">
                                    Create multi-step cold email campaigns with intelligent follow-ups, spintax personalization, A/B testing, and smart sending windows. AuraSend handles the timing — you focus on the message.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Link href="/login" className="inline-flex items-center gap-2 h-14 px-8 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-full font-bold text-base shadow-xl transition-all transform hover:-translate-y-1">
                                        Build Your Campaign <ArrowRight size={18} />
                                    </Link>
                                </div>
                            </div>
                            {/* Campaign builder mockup */}
                            <div className="flex-1 w-full max-w-lg">
                                <div className="bg-white dark:bg-zinc-900 backdrop-blur border border-white/10 rounded-3xl p-6 space-y-3">
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">Campaign: SaaS Outreach Q1</p>
                                    {[
                                        { step: 1, label: 'Initial Email', delay: 'Day 0', rate: '68% opened', color: 'indigo' },
                                        { step: 2, label: 'Follow-up #1', delay: '+3 days', rate: '42% opened', color: 'blue' },
                                        { step: 3, label: 'Follow-up #2', delay: '+7 days', rate: '28% opened', color: 'purple' },
                                        { step: 4, label: 'Final Reply', delay: '+14 days', rate: 'In progress', color: 'pink' },
                                    ].map((s) => (
                                        <div key={s.step} className="flex items-center gap-4 bg-white dark:bg-zinc-900 rounded-xl px-4 py-3 border border-white/10">
                                            <div className={`w-8 h-8 rounded-full bg-${s.color}-600 text-white flex items-center justify-center text-sm font-black shrink-0`}>{s.step}</div>
                                            <div className="flex-1">
                                                <p className="text-white font-semibold text-sm">{s.label}</p>
                                                <p className="text-slate-400 text-xs">{s.delay}</p>
                                            </div>
                                            <span className="text-emerald-400 text-xs font-semibold">{s.rate}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How it works */}
                <section className="py-24 bg-white dark:bg-zinc-900/60">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <div>
                                <h2 className="text-4xl font-black text-slate-900 dark:text-zinc-50 mb-6">A campaign builder built for B2B sales teams</h2>
                                <p className="text-lg text-slate-500 dark:text-zinc-400 mb-10 leading-relaxed">
                                    From your first email to your fourth follow-up, AuraSend gives you full control over your outreach sequence. Design intelligent flows, personalize at scale, and know exactly when each prospect is in your funnel.
                                </p>
                                <ul className="space-y-5">
                                    {[
                                        'Multi-step drip sequences with smart delays',
                                        'Spintax for unique email variations at scale',
                                        'A/B testing for subject lines and body copy',
                                        'Automatic stop on reply, bounce, or unsubscribe',
                                        'Custom send windows by timezone and business hours',
                                        'Inbox rotation across multiple connected accounts',
                                        'Per-campaign analytics and conversion tracking',
                                    ].map((f, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <CheckCircle className="text-indigo-500 shrink-0 mt-0.5" size={20} />
                                            <span className="text-slate-700 dark:text-zinc-300 font-medium">{f}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4">
                                {[
                                    { icon: Edit3, title: 'Spintax Personalization', desc: 'Write one template that generates thousands of unique variations automatically.' },
                                    { icon: GitBranch, title: 'Conditional Sequences', desc: 'Branch your sequence based on whether a lead opened, clicked, or replied.' },
                                    { icon: Clock, title: 'Smart Send Windows', desc: 'Schedule sends during business hours in the recipient\'s local timezone.' },
                                    { icon: RefreshCw, title: 'Inbox Rotation', desc: 'Distribute sending load across multiple accounts to stay within safe limits.' },
                                ].map((f, i) => (
                                    <div key={i} className="bg-slate-50 dark:bg-zinc-900/50 rounded-2xl p-5 border border-slate-200 dark:border-zinc-800">
                                        <f.icon className="text-indigo-600 mb-3" size={24} />
                                        <h4 className="font-bold text-slate-900 dark:text-zinc-50 mb-1">{f.title}</h4>
                                        <p className="text-sm text-slate-500 dark:text-zinc-400">{f.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-20 bg-gradient-to-r from-indigo-600 to-blue-600">
                    <div className="max-w-4xl mx-auto px-6 text-center">
                        <h2 className="text-4xl font-black text-white mb-4">Launch your first campaign in minutes.</h2>
                        <p className="text-xl text-indigo-100 mb-8">Fully automated outreach that scales without the extra headcount.</p>
                        <Link href="/login" className="inline-flex items-center gap-2 h-14 px-8 bg-white dark:bg-zinc-900/60 text-indigo-700 font-bold rounded-full text-base shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all">
                            Start Campaigning Free <ArrowRight size={18} />
                        </Link>
                    </div>
                </section>
            </main>
            <MarketingFooter />
        </div>
    );
}
