'use client';

import Link from 'next/link';
import { MarketingNav, MarketingFooter } from '@/components/MarketingLayout';
import { Users, CheckCircle, ArrowRight, Filter, Tag, Upload, Download, BarChart2 } from 'lucide-react';

export default function LeadsToolPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-zinc-900/60 font-sans">
            <MarketingNav active="/tools/leads" />
            <main className="pt-20">
                {/* Hero */}
                <section className="relative bg-gradient-to-br from-orange-950 via-slate-900 to-slate-950 overflow-hidden pt-28 pb-24">
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-orange-600/15 blur-[120px] rounded-full" />
                        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-yellow-600/10 blur-[100px] rounded-full" />
                        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
                    </div>
                    <div className="max-w-7xl mx-auto px-6 relative z-10">
                        <div className="flex flex-col lg:flex-row items-center gap-16">
                            <div className="flex-1 text-center lg:text-left">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-300 text-sm font-semibold mb-8">
                                    <Users size={16} /> Leads & List Management
                                </div>
                                <h1 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
                                    Organize, segment, and<br />
                                    <span className="bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">own your lead data.</span>
                                </h1>
                                <p className="text-xl text-slate-400 mb-10 leading-relaxed max-w-2xl">
                                    Import leads from CSV, enrich them with extra data, filter by status, and assign them to the right campaigns — all from a clean, powerful interface. Your lists. Your control.
                                </p>
                                <Link href="/login" className="inline-flex items-center gap-2 h-14 px-8 bg-gradient-to-r from-orange-600 to-yellow-500 hover:from-orange-500 hover:to-yellow-400 text-white rounded-full font-bold text-base shadow-xl transition-all transform hover:-translate-y-1">
                                    Manage Your Leads <ArrowRight size={18} />
                                </Link>
                            </div>
                            {/* Visual */}
                            <div className="flex-1 w-full max-w-lg">
                                <div className="bg-white dark:bg-zinc-900 backdrop-blur border border-white/10 rounded-3xl p-6">
                                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                                        <span className="text-white font-bold">Lead List: SaaS Founders</span>
                                        <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 text-xs font-bold">2,450 leads</span>
                                    </div>
                                    <div className="space-y-3">
                                        {[
                                            { name: 'Sarah Johnson', co: 'Acme Corp', status: 'Replied', color: 'emerald' },
                                            { name: 'Michael Chen', co: 'TechFlow Inc', status: 'Opened', color: 'blue' },
                                            { name: 'Emma Davis', co: 'Growify', status: 'Pending', color: 'slate' },
                                            { name: 'James Wilson', co: 'SalesHub', status: 'Bounced', color: 'red' },
                                        ].map((lead) => (
                                            <div key={lead.name} className="flex items-center justify-between bg-white dark:bg-zinc-900 rounded-xl px-4 py-3 border border-white/10">
                                                <div>
                                                    <p className="text-white font-semibold text-sm">{lead.name}</p>
                                                    <p className="text-slate-400 text-xs">{lead.co}</p>
                                                </div>
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold bg-${lead.color}-500/20 text-${lead.color}-300 border border-${lead.color}-500/30`}>{lead.status}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Feature grid */}
                <section className="py-24 bg-slate-50 dark:bg-zinc-900/50">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-black text-slate-900 dark:text-zinc-50 mb-4">Complete Lead Management System</h2>
                            <p className="text-xl text-slate-500 dark:text-zinc-400 max-w-2xl mx-auto">From import to conversion — manage every lead across your entire sales pipeline.</p>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                { icon: Upload, title: 'CSV Import', desc: 'Bulk import thousands of leads at once via CSV with automatic field mapping. Detect and skip duplicate emails automatically.', color: 'text-orange-600', bg: 'bg-orange-50' },
                                { icon: Filter, title: 'Smart Filtering', desc: 'Filter leads by status: Pending, Sent, Opened, Replied, Bounced, Unsubscribed. Build exact segments for surgical targeting.', color: 'text-blue-600', bg: 'bg-blue-50' },
                                { icon: Tag, title: 'Campaign Assignment', desc: 'Assign leads directly to campaigns. Leads are automatically excluded from future sends if they reply or unsubscribe.', color: 'text-purple-600', bg: 'bg-purple-50' },
                                { icon: Download, title: 'Export Anytime', desc: 'Export your entire lead list, or filtered segments, to CSV at any time. Your data is always yours.', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                { icon: CheckCircle, title: 'Verification Status', desc: 'See real-time email validity status next to each lead. Filter down to only valid, safe-to-send emails automatically.', color: 'text-indigo-600', bg: 'bg-indigo-50' },
                                { icon: BarChart2, title: 'Per-Lead Analytics', desc: 'See open rate, reply rate, and email sequences sent for every individual lead. Know exactly where in the funnel they are.', color: 'text-pink-600', bg: 'bg-pink-50' },
                            ].map((f, i) => (
                                <div key={i} className="bg-white dark:bg-zinc-900/60 rounded-2xl p-6 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 hover:shadow-md transition-all">
                                    <div className={`w-12 h-12 ${f.bg} ${f.color} rounded-xl flex items-center justify-center mb-4`}>
                                        <f.icon size={24} />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-50 mb-2">{f.title}</h3>
                                    <p className="text-slate-500 dark:text-zinc-400 text-sm leading-relaxed">{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-20 bg-gradient-to-r from-orange-500 to-yellow-500">
                    <div className="max-w-4xl mx-auto px-6 text-center">
                        <h2 className="text-4xl font-black text-white mb-4">Start organizing your leads today.</h2>
                        <p className="text-xl text-orange-50 mb-8">Import your first list free. No credit card required.</p>
                        <Link href="/login" className="inline-flex items-center gap-2 h-14 px-8 bg-white dark:bg-zinc-900/60 text-orange-600 font-bold rounded-full text-base shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all">
                            Import Leads Free <ArrowRight size={18} />
                        </Link>
                    </div>
                </section>
            </main>
            <MarketingFooter />
        </div>
    );
}
