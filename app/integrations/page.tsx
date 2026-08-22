import Link from 'next/link';
import type { Metadata } from 'next';
import { MarketingNav, MarketingFooter } from '@/components/MarketingLayout';
import { Link2, Webhook, FileText, Blocks, Zap, Database, ArrowRight, Grid, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Integrations — AuraSend',
    description: 'Connect AuraSend with your favorite CRM, Sales tools, and workflows.',
    keywords: 'AuraSend integrations, webhooks, API, Zapier, HubSpot connection',
};

const INTEGRATIONS = [
    {
        name: 'Google Workspace',
        icon: <Database size={28} className="text-white" />,
        desc: 'Native OAuth integration to connect Gmail accounts securely in one click. No app passwords needed.',
        status: 'Native',
        colors: 'bg-gradient-to-br from-blue-500 to-indigo-600',
        shadow: 'shadow-blue-500/20'
    },
    {
        name: 'Any SMTP / IMAP',
        icon: <Zap size={28} className="text-white" />,
        desc: 'Connect Office 365, Zoho, Namecheap, or any arbitrary email provider directly through SMTP credentials.',
        status: 'Native',
        colors: 'bg-gradient-to-br from-amber-500 to-orange-500',
        shadow: 'shadow-orange-500/20'
    },
    {
        name: 'CSV & Excel',
        icon: <FileText size={28} className="text-white" />,
        desc: 'Automatically map custom variables when importing leads directly from detailed spreadsheets or databases.',
        status: 'Native',
        colors: 'bg-gradient-to-br from-emerald-500 to-teal-500',
        shadow: 'shadow-emerald-500/20'
    },
    {
        name: 'Webhooks API',
        icon: <Webhook size={28} className="text-white" />,
        desc: 'Push event data (opens, clicks, replies, bounces) to your custom endpoints in real-time as it happens.',
        status: 'Coming Soon',
        colors: 'bg-gradient-to-br from-purple-500 to-pink-500',
        shadow: 'shadow-purple-500/20'
    },
    {
        name: 'Zapier Automation',
        icon: <Blocks size={28} className="text-white" />,
        desc: 'Connect AuraSend to 5,000+ apps. Trigger campaigns instantly when inbound leads hit your CRM.',
        status: 'Coming Soon',
        colors: 'bg-gradient-to-br from-rose-500 to-red-500',
        shadow: 'shadow-rose-500/20'
    },
    {
        name: 'HubSpot Native Sync',
        icon: <Link2 size={28} className="text-white" />,
        desc: 'Two-way synchronization. Create contacts from replies and log email history straight into your HubSpot CRM.',
        status: 'Coming Soon',
        colors: 'bg-gradient-to-br from-slate-700 to-slate-900',
        shadow: 'shadow-slate-500/20'
    }
];

export default function IntegrationsPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-zinc-900/50 font-sans">
            <MarketingNav active="/integrations" />

            <main className="pt-32 pb-24 relative overflow-hidden">
                <div className="absolute top-0 right-[-10%] w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute top-[40%] left-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center max-w-4xl mx-auto mb-20">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-bold tracking-wide shadow-sm mb-6">
                            <Grid size={16} /> Connect Your Stack
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-zinc-50 tracking-tight mb-6">
                            Works perfectly with <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">your existing stack.</span>
                        </h1>
                        <p className="text-xl text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">Connect your inboxes effortlessly today, route data via webhooks, and stay tuned for our upcoming native CRM connections to keep your sales workflow unified.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-32">
                        {INTEGRATIONS.map((int, i) => (
                            <div key={i} className="bg-white dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800/80 rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 flex flex-col group relative overflow-hidden">
                                <div className={`absolute top-0 right-0 w-32 h-32 ${int.colors} opacity-0 group-hover:opacity-5 blur-3xl rounded-full transition-opacity duration-500`} />

                                <div className="flex items-center justify-between mb-8 relative z-10">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${int.colors} shadow-lg ${int.shadow} group-hover:scale-110 transition-transform duration-300`}>
                                        {int.icon}
                                    </div>
                                    <span className={`px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded-full border ${int.status === 'Native' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 dark:bg-zinc-900/50 text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-zinc-800'}`}>
                                        {int.status}
                                    </span>
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-zinc-50 mb-3 relative z-10">{int.name}</h3>
                                <p className="text-base text-slate-500 dark:text-zinc-400 font-medium leading-relaxed mb-6 flex-1 relative z-10">{int.desc}</p>

                                {int.status === 'Native' ? (
                                    <div className="flex items-center gap-2 text-sm font-bold text-emerald-600 relative z-10">
                                        <Sparkles size={16} /> Fully Supported
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-sm font-bold text-slate-400 relative z-10">
                                        In Development ...
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="max-w-5xl mx-auto">
                        <div className="bg-slate-950 rounded-[3rem] p-16 md:p-24 text-center text-white relative overflow-hidden shadow-2xl">
                            <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500 via-slate-950 to-slate-950"></div>
                            <h2 className="text-4xl md:text-5xl font-black mb-6 relative z-10">Need a custom integration?</h2>
                            <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto relative z-10 font-medium">Have a massive list or custom CRM? AuraSend's robust API makes it easy to integrate with anything. Start sending today.</p>
                            <Link href="/login" className="inline-flex items-center justify-center gap-2 h-16 px-10 bg-white dark:bg-zinc-900/60 hover:bg-slate-100 dark:bg-zinc-800/50 text-slate-900 dark:text-zinc-50 rounded-full font-bold text-lg transition-all shadow-xl hover:scale-105 relative z-10 w-full sm:w-auto">
                                Get API Access <ArrowRight size={20} />
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            <MarketingFooter />
        </div>
    );
}
