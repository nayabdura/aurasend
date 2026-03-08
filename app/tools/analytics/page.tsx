import Link from 'next/link';
import type { Metadata } from 'next';
import { MarketingNav, MarketingFooter } from '@/components/MarketingLayout';
import { BarChart2, TrendingUp, Eye, MousePointerClick, RefreshCw, CheckCircle, ArrowRight, Clock, Target } from 'lucide-react';

export const metadata: Metadata = {
    title: 'AuraSend Analytics — Real-Time Campaign Performance Tracking',
    description: 'Track open rates, click rates, reply rates, bounces, and unsubscribes for every campaign in real-time. Make data-driven decisions with AuraSend Analytics.',
};

export default function AnalyticsToolPage() {
    return (
        <div className="min-h-screen bg-white font-sans">
            <MarketingNav active="/tools/analytics" />
            <main className="pt-20">
                {/* Hero */}
                <section className="relative bg-gradient-to-br from-cyan-950 via-slate-900 to-slate-950 overflow-hidden pt-28 pb-24">
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-600/15 blur-[120px] rounded-full" />
                        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/10 blur-[100px] rounded-full" />
                        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
                    </div>
                    <div className="max-w-7xl mx-auto px-6 relative z-10">
                        <div className="flex flex-col lg:flex-row items-center gap-16">
                            <div className="flex-1 text-center lg:text-left">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-sm font-semibold mb-8">
                                    <BarChart2 size={16} /> Campaign Analytics
                                </div>
                                <h1 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
                                    Know exactly what's<br />
                                    <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">working and why.</span>
                                </h1>
                                <p className="text-xl text-slate-400 mb-10 leading-relaxed max-w-2xl">
                                    AuraSend's Analytics Dashboard gives you a real-time view into every campaign's performance. Track opens, clicks, replies, bounces, and unsubscribes down to the individual email level — so you always know what to optimize next.
                                </p>
                                <Link href="/login" className="inline-flex items-center gap-2 h-14 px-8 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-full font-bold text-base shadow-xl transition-all transform hover:-translate-y-1">
                                    Access Your Analytics <ArrowRight size={18} />
                                </Link>
                            </div>
                            {/* Mock Analytics Dashboard */}
                            <div className="flex-1 w-full max-w-lg">
                                <div className="bg-white/5 backdrop-blur border border-white/10 rounded-3xl p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-white font-bold">Campaign: SaaS Founders Q1</h3>
                                        <span className="text-xs text-slate-400">Last 30 days</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mb-6">
                                        {[
                                            { label: 'Emails Sent', val: '4,280', icon: Target, color: 'text-cyan-400' },
                                            { label: 'Open Rate', val: '68.4%', icon: Eye, color: 'text-blue-400' },
                                            { label: 'Click Rate', val: '12.1%', icon: MousePointerClick, color: 'text-purple-400' },
                                            { label: 'Replies', val: '342', icon: RefreshCw, color: 'text-emerald-400' },
                                        ].map((s) => (
                                            <div key={s.label} className="bg-white/5 rounded-xl p-4 border border-white/10">
                                                <s.icon size={18} className={`${s.color} mb-2`} />
                                                <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
                                                <p className="text-xs text-slate-400 mt-1">{s.label}</p>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Mini bar chart */}
                                    <div className="flex items-end gap-1.5 h-16">
                                        {[40, 65, 45, 80, 55, 70, 90, 60, 75, 85].map((h, i) => (
                                            <div key={i} className="flex-1 bg-gradient-to-t from-cyan-600 to-blue-500 rounded-t-sm" style={{ height: `${h}%`, opacity: 0.6 + (i * 0.04) }} />
                                        ))}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2 text-center">Daily opens over the last 10 days</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Feature grid */}
                <section className="py-24 bg-slate-50">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-black text-slate-900 mb-4">Every metric you need to scale your outreach</h2>
                            <p className="text-xl text-slate-500 max-w-2xl mx-auto">From high-level campaign overviews to individual email tracking — all in one dashboard.</p>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                { icon: Eye, title: 'Open Rate Tracking', desc: 'See exactly when each lead opens your email. Track by campaign, by follow-up step, and by individual contact.', color: 'text-blue-600', bg: 'bg-blue-50' },
                                { icon: MousePointerClick, title: 'Click Tracking', desc: 'Identify which links in your email perform best. Pixel-level tracking for every call-to-action you include.', color: 'text-purple-600', bg: 'bg-purple-50' },
                                { icon: RefreshCw, title: 'Reply Detection', desc: 'Automatic reply detection that stops follow-up sequences the moment a lead responds — no more awkward double-sends.', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                { icon: TrendingUp, title: 'A/B Test Results', desc: 'Compare performance across email variants side by side. Automatically declare a winner after statistically significant data.', color: 'text-indigo-600', bg: 'bg-indigo-50' },
                                { icon: Clock, title: 'Best Send Time', desc: 'AI-powered analysis of when your specific audience is most likely to open based on your historical data.', color: 'text-orange-600', bg: 'bg-orange-50' },
                                { icon: BarChart2, title: 'Account Health', desc: 'Monitor sending health per connected inbox. See bounce rates, spam complaints, and sending limits at a glance.', color: 'text-cyan-600', bg: 'bg-cyan-50' },
                            ].map((f, i) => (
                                <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-md transition-shadow">
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
                <section className="py-20 bg-gradient-to-r from-cyan-600 to-blue-600">
                    <div className="max-w-4xl mx-auto px-6 text-center">
                        <h2 className="text-4xl font-black text-white mb-4">Make every campaign smarter than the last.</h2>
                        <p className="text-xl text-cyan-100 mb-8">Start analyzing your campaign data for free today.</p>
                        <Link href="/login" className="inline-flex items-center gap-2 h-14 px-8 bg-white text-cyan-700 font-bold rounded-full text-base shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all">
                            View Analytics Free <ArrowRight size={18} />
                        </Link>
                    </div>
                </section>
            </main>
            <MarketingFooter />
        </div>
    );
}
