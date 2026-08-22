import Link from 'next/link';
import type { Metadata } from 'next';
import { MarketingNav, MarketingFooter } from '@/components/MarketingLayout';
import { Building2, Briefcase, GraduationCap, ArrowRight, Lightbulb, UserCheck, Target } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Use Cases — AuraSend',
    description: 'See how different industries use AuraSend to automate their outreach and close more deals.',
    keywords: 'AuraSend use cases, B2B sales email, agency outreach, startup cold email',
};

const CASES = [
    {
        title: 'Marketing Agencies',
        icon: <Briefcase size={32} />,
        desc: 'Run cold email campaigns for 20 different clients from a single dashboard. White-label reports, complete campaign isolation, and unlimited inbox scaling with zero cross-contamination risk.',
        metrics: { val: '3x', label: 'More meetings booked per client' },
        points: ['Client campaign isolation', 'White-label reporting', 'Unlimited inbox scaling'],
        colors: {
            bg: 'bg-indigo-50', text: 'text-indigo-600', hover: 'group-hover:bg-indigo-600', border: 'border-indigo-100', gradient: 'from-indigo-600 to-indigo-400'
        }
    },
    {
        title: 'B2B SaaS Startups',
        icon: <Lightbulb size={32} />,
        desc: 'Find your first 1,000 customers. Use A/B template testing to dial in your value proposition, and let our Warmup Engine ensure your product reaches the primary inbox every time.',
        metrics: { val: '40%', label: 'Average open rates achieved' },
        points: ['A/B Testing built-in', 'Automated follow-up sequences', 'Real-time open tracking'],
        colors: {
            bg: 'bg-emerald-50', text: 'text-emerald-600', hover: 'group-hover:bg-emerald-600', border: 'border-emerald-100', gradient: 'from-emerald-500 to-teal-400'
        }
    },
    {
        title: 'Enterprise Sales',
        icon: <Building2 size={32} />,
        desc: 'Scale outbound efforts predictably. AuraSend dynamically rotates your team\'s inboxes to keep daily volume in the thousands without triggering spam filters or burning domains.',
        metrics: { val: '99%', label: 'Deliverability retention' },
        points: ['Advanced inbox rotation', 'Domain health monitoring', 'Team-wide blocklists'],
        colors: {
            bg: 'bg-blue-50', text: 'text-blue-600', hover: 'group-hover:bg-blue-600', border: 'border-blue-100', gradient: 'from-blue-600 to-cyan-500'
        }
    },
    {
        title: 'Recruiters & HR',
        icon: <UserCheck size={32} />,
        desc: 'Engage passive candidates effectively. Create personalized touchpoints across multiple weeks that automatically pause the second a candidate replies to your sequence.',
        metrics: { val: '10h', label: 'Saved per week on follow-ups' },
        points: ['Reply-detection pausing', 'Personalization variables', 'Unified reply inbox'],
        colors: {
            bg: 'bg-purple-50', text: 'text-purple-600', hover: 'group-hover:bg-purple-600', border: 'border-purple-100', gradient: 'from-purple-600 to-pink-500'
        }
    }
];

export default function UseCasesPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-zinc-900/50 font-sans">
            <MarketingNav active="/use-cases" />

            <main className="pt-32 pb-24 relative overflow-hidden">
                <div className="absolute top-0 right-[20%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute top-[30%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center max-w-4xl mx-auto mb-20">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-bold tracking-wide shadow-sm mb-6">
                            <Target size={16} /> Built for growth
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-zinc-50 tracking-tight mb-6">
                            Built for every kind of <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">outreach.</span>
                        </h1>
                        <p className="text-xl text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">From solo founders to massive agencies, AuraSend provides the architecture to scale your revenue engine without the manual busywork.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 mb-32">
                        {CASES.map((c, i) => (
                            <div key={i} className="bg-white dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800/80 rounded-[2rem] p-10 shadow-xl shadow-slate-200/50 hover:-translate-y-2 transition-transform duration-300 relative overflow-hidden group">
                                {/* Decorative Gradient Blur */}
                                <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl ${c.colors.gradient} opacity-5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 group-hover:opacity-20 transition-opacity duration-500`} />

                                <div className="flex flex-col sm:flex-row gap-8 relative z-10">
                                    <div className="flex-1">
                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-300 ${c.colors.bg} ${c.colors.text} ${c.colors.hover} group-hover:text-white border ${c.colors.border}`}>
                                            {c.icon}
                                        </div>
                                        <h3 className="text-3xl font-black text-slate-900 dark:text-zinc-50 mb-4">{c.title}</h3>
                                        <p className="text-slate-500 dark:text-zinc-400 leading-relaxed text-lg mb-8 font-medium">{c.desc}</p>
                                        <ul className="space-y-4">
                                            {c.points.map((p, j) => (
                                                <li key={j} className="flex items-center gap-3 text-base font-semibold text-slate-700 dark:text-zinc-300">
                                                    <div className={`w-2 h-2 rounded-full ${c.colors.bg.replace('50', '500')}`} />
                                                    {p}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="sm:w-32 shrink-0 flex flex-col justify-end pb-2">
                                        <div className={`bg-gradient-to-t ${c.colors.gradient} text-white p-6 rounded-2xl text-center shadow-lg transform rotate-2 group-hover:rotate-0 transition-transform duration-300`}>
                                            <span className="block text-3xl font-black mb-1">{c.metrics.val}</span>
                                            <span className="block text-xs font-bold uppercase tracking-widest opacity-90">{c.metrics.label}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Global CTA */}
                    <div className="max-w-5xl mx-auto">
                        <div className="bg-slate-950 rounded-[3rem] p-16 md:p-24 text-center text-white relative overflow-hidden shadow-2xl">
                            <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500 via-slate-950 to-slate-950"></div>
                            <h2 className="text-5xl font-black mb-6 relative z-10">Don't see your use case?</h2>
                            <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto relative z-10">If you need to send cold emails at scale without landing in spam, AuraSend's infrastructure can handle it.</p>
                            <Link href="/login" className="inline-flex items-center justify-center gap-2 h-16 px-10 bg-white dark:bg-zinc-900/60 hover:bg-slate-100 dark:bg-zinc-800/50 text-slate-900 dark:text-zinc-50 rounded-full font-bold text-lg transition-all shadow-xl hover:scale-105 relative z-10 w-full sm:w-auto">
                                Start Free Trial <ArrowRight size={20} />
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            <MarketingFooter />
        </div>
    );
}
