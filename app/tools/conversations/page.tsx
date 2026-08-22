import Link from 'next/link';
import type { Metadata } from 'next';
import { MarketingNav, MarketingFooter } from '@/components/MarketingLayout';
import { Inbox, CheckCircle, ArrowRight, MessageSquare, Tag, Filter, Star, Bell, Search } from 'lucide-react';

export const metadata: Metadata = {
    title: 'AuraSend Conversations — Unified Reply Inbox for Cold Email',
    description: 'Manage all your cold email replies in one place. AuraSend\'s Conversations inbox connects across all your sending accounts and gives you a clean, organized view of every lead response.',
};

export default function ConversationsToolPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-zinc-900/60 font-sans">
            <MarketingNav active="/tools/conversations" />
            <main className="pt-20">
                {/* Hero */}
                <section className="relative bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 overflow-hidden pt-28 pb-24">
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-600/15 blur-[120px] rounded-full" />
                        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
                    </div>
                    <div className="max-w-7xl mx-auto px-6 relative z-10">
                        <div className="flex flex-col lg:flex-row items-center gap-16">
                            <div className="flex-1 text-center lg:text-left">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm font-semibold mb-8">
                                    <Inbox size={16} /> Unified Conversations Inbox
                                </div>
                                <h1 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
                                    All your replies.<br />
                                    <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">One clean inbox.</span>
                                </h1>
                                <p className="text-xl text-slate-400 mb-10 leading-relaxed max-w-2xl">
                                    When leads reply to your campaigns, all responses flow into AuraSend's unified Conversations inbox — regardless of which sending account you used. Tag, filter, star, and respond to leads directly from one central place.
                                </p>
                                <Link href="/login" className="inline-flex items-center gap-2 h-14 px-8 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-full font-bold text-base shadow-xl transition-all transform hover:-translate-y-1">
                                    Access Your Inbox <ArrowRight size={18} />
                                </Link>
                            </div>
                            {/* Inbox Mockup */}
                            <div className="flex-1 w-full max-w-lg">
                                <div className="bg-white dark:bg-zinc-900 backdrop-blur border border-white/10 rounded-3xl overflow-hidden">
                                    {/* Top bar */}
                                    <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                                        <h3 className="text-white font-bold flex items-center gap-2"><Inbox size={18} className="text-emerald-400" /> Conversations</h3>
                                        <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-bold">12 unread</span>
                                    </div>
                                    {/* Conversation list */}
                                    <div className="divide-y divide-white/5">
                                        {[
                                            { name: 'Sarah Johnson', co: 'Acme Corp', msg: 'Hi! Yes, I\'d love to schedule a quick call...', time: '2m ago', unread: true, star: true },
                                            { name: 'Michael Chen', co: 'TechFlow', msg: 'Thanks for reaching out. Can you send pricing?', time: '15m ago', unread: true, star: false },
                                            { name: 'Emma Davis', co: 'Growify', msg: 'Not the right time for us. Maybe Q3.', time: '1h ago', unread: false, star: false },
                                            { name: 'James Wilson', co: 'SalesHub', msg: 'Looks interesting. Let\'s chat this week.', time: '2h ago', unread: false, star: true },
                                        ].map((c) => (
                                            <div key={c.name} className={`flex items-start gap-3 px-5 py-4 hover:bg-white dark:bg-zinc-900 transition-colors cursor-pointer ${c.unread ? 'bg-white dark:bg-zinc-900' : ''}`}>
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                                    {c.name.charAt(0)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <span className={`text-sm font-bold ${c.unread ? 'text-white' : 'text-slate-300'}`}>{c.name}</span>
                                                        <span className="text-xs text-slate-500 dark:text-zinc-400 shrink-0">{c.time}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-400 truncate mt-0.5">{c.co} · {c.msg}</p>
                                                </div>
                                                {c.star && <Star size={14} className="text-yellow-400 fill-yellow-400 shrink-0 mt-1" />}
                                                {c.unread && <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 mt-2" />}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section className="py-24 bg-slate-50 dark:bg-zinc-900/50">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-black text-slate-900 dark:text-zinc-50 mb-4">Never miss a hot lead in your inbox again</h2>
                            <p className="text-xl text-slate-500 dark:text-zinc-400 max-w-2xl mx-auto">All replies across all accounts, organized the way a sales team actually operates.</p>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                { icon: MessageSquare, title: 'Unified Multi-Account Inbox', desc: 'Replies from Gmail, Outlook, and all connected accounts appear in one shared inbox — no switching between accounts.', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                { icon: Tag, title: 'Smart Tagging & Labels', desc: 'Tag replies as "Interested", "Not Now", "Meeting Booked", or custom statuses. Filter your pipeline by tag in seconds.', color: 'text-blue-600', bg: 'bg-blue-50' },
                                { icon: Filter, title: 'Advanced Filtering', desc: 'Filter by campaign, account, lead status, date range, or keyword. Find any conversation in your entire history instantly.', color: 'text-purple-600', bg: 'bg-purple-50' },
                                { icon: Star, title: 'Star Hot Leads', desc: 'Star important conversations to surface them at the top. Never lose track of a warm lead buried in your inbox.', color: 'text-yellow-600', bg: 'bg-yellow-50' },
                                { icon: Bell, title: 'Real-Time Notifications', desc: 'Get notified the second a lead replies so you can strike while the iron is hot. Browser and email notifications supported.', color: 'text-red-600', bg: 'bg-red-50' },
                                { icon: Search, title: 'Full-Text Search', desc: 'Search across the entire conversation history by lead name, company, email content, or any keyword. Find anything in seconds.', color: 'text-indigo-600', bg: 'bg-indigo-50' },
                            ].map((f, i) => (
                                <div key={i} className="bg-white dark:bg-zinc-900/60 rounded-2xl p-6 border border-slate-200 dark:border-zinc-800 hover:shadow-md transition-shadow">
                                    <div className={`w-12 h-12 ${f.bg} ${f.color} rounded-xl flex items-center justify-center mb-4`}>
                                        <f.icon size={24} />
                                    </div>
                                    <h3 className="font-bold text-slate-900 dark:text-zinc-50 mb-2">{f.title}</h3>
                                    <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-20 bg-gradient-to-r from-emerald-600 to-teal-600">
                    <div className="max-w-4xl mx-auto px-6 text-center">
                        <h2 className="text-4xl font-black text-white mb-4">Centralize every reply in one inbox.</h2>
                        <p className="text-xl text-emerald-100 mb-8">Start managing your conversations for free today.</p>
                        <Link href="/login" className="inline-flex items-center gap-2 h-14 px-8 bg-white dark:bg-zinc-900/60 text-emerald-700 font-bold rounded-full text-base shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all">
                            Open My Inbox <ArrowRight size={18} />
                        </Link>
                    </div>
                </section>
            </main>
            <MarketingFooter />
        </div>
    );
}
