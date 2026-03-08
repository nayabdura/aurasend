import Link from 'next/link';
import type { Metadata } from 'next';
import { MarketingNav, MarketingFooter } from '@/components/MarketingLayout';
import { ArrowRight, Heart, Target, Lightbulb, Users, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
    title: 'About AuraSend — Built for Outreach Professionals',
    description: 'AuraSend was built to give every sales team access to enterprise-level cold email infrastructure without the enterprise price tag.',
};

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <MarketingNav active="/about" />

            <main className="pt-32 pb-24 relative overflow-hidden">
                <div className="absolute top-0 right-[-10%] w-[600px] h-[600px] bg-rose-500/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute top-[30%] left-[-10%] w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

                <div className="max-w-7xl mx-auto px-6 relative z-10">

                    {/* Hero Section */}
                    <div className="grid lg:grid-cols-2 gap-16 items-center pb-24 border-b border-slate-200">
                        <div>
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-50 border border-rose-100 text-rose-700 text-sm font-bold tracking-wide shadow-sm mb-6">
                                <Sparkles size={16} /> Our Story
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight mb-8 leading-tight">
                                We built the tool <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500">
                                    we always wanted.
                                </span>
                            </h1>
                            <p className="text-xl text-slate-500 leading-relaxed mb-6 font-medium">
                                AuraSend started from a simple frustration: the best cold email tools cost thousands per month, lock features behind paywalls, and are bloated with things you'll never use.
                            </p>
                            <p className="text-lg text-slate-500 leading-relaxed mb-10">
                                We built this for modern B2B teams that need a complete, clean, and affordable outreach system. One platform for everything — inbox management, warmup, campaigns, analytics, and deliverability.
                            </p>
                            <Link href="/login" className="inline-flex items-center justify-center gap-2 h-14 px-8 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white rounded-xl font-bold transition-all shadow-xl shadow-rose-500/25 w-full sm:w-auto hover:-translate-y-1">
                                Start your journey <ArrowRight size={18} />
                            </Link>
                        </div>

                        {/* Stats panel */}
                        <div className="grid grid-cols-2 gap-6">
                            {[
                                { num: '500+', label: 'Active Teams', icon: <Users size={24} />, color: 'rose' },
                                { num: '22M+', label: 'Emails Sent', icon: <Target size={24} />, color: 'amber' },
                                { num: '99.5%', label: 'Delivery Rate', icon: <Sparkles size={24} />, color: 'emerald' },
                                { num: '4.9★', label: 'User Rating', icon: <Heart size={24} />, color: 'pink' },
                            ].map(s => (
                                <div key={s.label} className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 hover:-translate-y-2 transition-transform duration-300 relative overflow-hidden group">
                                    <div className={`absolute -right-8 -top-8 w-24 h-24 bg-${s.color}-500/10 rounded-full blur-xl group-hover:bg-${s.color}-500/20 transition-all duration-300`} />
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 bg-${s.color}-50 text-${s.color}-500 border border-${s.color}-100 group-hover:scale-110 transition-transform duration-300`}>
                                        {s.icon}
                                    </div>
                                    <div className="text-4xl font-black text-slate-900 mb-2">{s.num}</div>
                                    <div className="text-sm text-slate-500 font-bold uppercase tracking-wider">{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Mission & Values */}
                    <div className="py-24">
                        <div className="text-center max-w-3xl mx-auto mb-20">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white text-sm font-bold tracking-wide shadow-sm mb-6">
                                Our Mission
                            </div>
                            <h2 className="text-5xl font-black text-slate-900 tracking-tight mb-8">
                                Outreach infrastructure <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-600 to-slate-400">for everyone</span>
                            </h2>
                            <p className="text-xl text-slate-500 leading-relaxed font-medium">
                                To give every sales team, consultant, and founder access to the infrastructure that only large enterprise companies previously had. Clean software, transparent pricing, fair limits — and everything working exactly the way it should.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                {
                                    icon: <Lightbulb size={28} />,
                                    title: 'Simplicity over everything',
                                    desc: 'If a feature makes the product harder to use, it doesn\'t belong here. Every screen and every workflow should be self-explanatory.',
                                    color: 'blue'
                                },
                                {
                                    icon: <Target size={28} />,
                                    title: 'Deliverability is non-negotiable',
                                    desc: 'Every architectural decision starts with: does this help our users land in the inbox? We will never compromise on this.',
                                    color: 'emerald'
                                },
                                {
                                    icon: <Heart size={28} />,
                                    title: 'Honest pricing always',
                                    desc: 'Two plans. No per-seat fees. No per-inbox fees. No surprise charges. What you see is exactly what you pay.',
                                    color: 'rose'
                                },
                            ].map(v => (
                                <div key={v.title} className="bg-white rounded-[2rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/50 hover:-translate-y-2 transition-transform duration-300 group">
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 bg-${v.color}-50 text-${v.color}-500 border border-${v.color}-100 group-hover:bg-${v.color}-500 group-hover:text-white transition-colors duration-300`}>
                                        {v.icon}
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 mb-4">{v.title}</h3>
                                    <p className="text-slate-500 leading-relaxed text-lg font-medium">{v.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Builder credit */}
                    <div className="mt-10">
                        <div className="bg-slate-950 rounded-[3rem] p-12 text-center text-white relative overflow-hidden shadow-2xl max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-center gap-8">
                            <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500 via-slate-950 to-slate-950"></div>
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center font-black text-white text-3xl shadow-lg relative z-10 transform -rotate-6">AI</div>
                            <div className="text-center md:text-left relative z-10">
                                <p className="font-black text-3xl text-white mb-2">Abdullah Imran</p>
                                <p className="text-lg text-slate-400 font-medium">Creator & Lead Developer · Powered by Abdullah Imran</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <MarketingFooter />
        </div>
    );
}
