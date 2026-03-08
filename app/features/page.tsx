import Link from 'next/link';
import type { Metadata } from 'next';
import { MarketingNav, MarketingFooter } from '@/components/MarketingLayout';
import { CheckCircle2, Globe2, Zap, BarChart2, GitBranch, Shield, Target, Mail, Users, Database, Bell, Lock, Code, Activity, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Features — AuraSend',
    description: 'Explore all AuraSend features: unlimited inboxes, warmup engine, campaign management, analytics, deliverability tools, follow-up sequences, and more.',
    keywords: 'cold email features, email automation tools, outreach platform features, email warmup',
};

const FEATURE_SECTIONS = [
    {
        icon: <Mail size={28} />,
        category: 'Inbox Management',
        color: 'indigo',
        items: [
            { name: 'Unlimited Gmail & SMTP', desc: 'Connect as many inboxes as you need. OAuth, App Password, and raw SMTP all supported. Zero per-inbox pricing.' },
            { name: 'Campaign Isolation', desc: 'Each campaign runs independently with only its assigned accounts. No cross-contamination between campaigns.' },
            { name: 'Daily Limit Controls', desc: 'Set custom daily send limits per account. Automatically resets at midnight. Quota protection built in.' },
            { name: 'Inbox Rotation', desc: 'Automatically distribute sends across multiple accounts to maximize volume while protecting each sender.' },
        ],
    },
    {
        icon: <Zap size={28} />,
        category: 'Warmup Engine',
        color: 'amber',
        items: [
            { name: 'Automated Warmup', desc: 'Gradually build inbox reputation using our warmup pool. Prevents spam classification from day one.' },
            { name: 'Health Score Tracking', desc: 'Each inbox gets a real-time health score based on warmup activity, replies, and bounce rates.' },
            { name: 'Warmup Scheduling', desc: 'Set custom sending windows per account. Warmup runs independently from your campaigns.' },
            { name: 'Reply Simulation', desc: 'Warmup inboxes send replies to each other, mimicking genuine human conversation for maximum trust signals.' },
        ],
    },
    {
        icon: <Target size={28} />,
        category: 'Campaigns',
        color: 'emerald',
        items: [
            { name: 'Smart Campaign Builder', desc: 'Create campaigns with templates, personalization variables, and precise account assignment.' },
            { name: 'Send Time Windows', desc: 'Set custom start/end times for automated sending. Weekday-only mode available.' },
            { name: 'A/B Template Testing', desc: 'Run 50/50 split tests between two templates. Measure which performs better across the same lead list.' },
            { name: 'Follow-up Sequences', desc: 'Multi-step automated follow-ups with configurable delays. Sequences pause instantly when a prospect replies.' },
        ],
    },
    {
        icon: <Users size={28} />,
        category: 'Leads & Contacts',
        color: 'blue',
        items: [
            { name: 'CSV Import', desc: 'Upload leads via CSV with automatic column mapping. Handles name, email, company, website, and custom fields.' },
            { name: 'Contact Management', desc: 'Tag, filter, and segment your contacts. Track full engagement history per lead.' },
            { name: 'Email Verification', desc: 'Built-in SMTP-level verification with catch-all and disposable email detection.' },
            { name: 'Bounce & Unsub Handling', desc: 'Bounced emails are auto-removed. Unsubscribes are added to a global Do Not Contact list automatically.' },
        ],
    },
    {
        icon: <BarChart2 size={28} />,
        category: 'Analytics & Reporting',
        color: 'violet',
        items: [
            { name: 'Real-Time Dashboard', desc: 'Track opens, clicks, and replies per campaign and per account in a live dashboard.' },
            { name: 'Deliverability Dashboard', desc: 'Monitor inbox placement, spam score, and bounce rates at a glance.' },
            { name: 'Conversation Inbox', desc: 'View all inbound replies from prospects in a unified inbox, per account.' },
            { name: 'Full Send Logs', desc: 'Complete audit trail of every email sent — account, recipient, campaign, status, timestamp.' },
        ],
    },
    {
        icon: <Shield size={28} />,
        category: 'Deliverability & Security',
        color: 'rose',
        items: [
            { name: 'Pre-Send Spam Check', desc: 'Check your email content against spam filters before launching any campaign.' },
            { name: 'Domain Health Monitoring', desc: 'SPF, DKIM, DMARC, and MX record checks for all your sending domains.' },
            { name: 'Blacklist System', desc: 'Global suppression list. Blacklisted addresses are permanently blocked from all campaigns.' },
            { name: 'Secure Authentication', desc: 'All OAuth tokens encrypted at rest. App passwords stored securely. No plaintext secrets.' },
        ],
    },
];

const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white',
    amber: 'bg-amber-50 text-amber-600 border-amber-100 group-hover:bg-amber-500 group-hover:text-white',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white',
    blue: 'bg-blue-50 text-blue-600 border-blue-100 group-hover:bg-blue-600 group-hover:text-white',
    violet: 'bg-violet-50 text-violet-600 border-violet-100 group-hover:bg-violet-600 group-hover:text-white',
    rose: 'bg-rose-50 text-rose-600 border-rose-100 group-hover:bg-rose-600 group-hover:text-white',
};

export default function FeaturesPage() {
    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <MarketingNav active="/features" />

            <main className="pt-32 pb-24 relative overflow-hidden">
                <div className="absolute top-0 right-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute top-[30%] left-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

                {/* Header */}
                <div className="max-w-4xl mx-auto px-6 text-center mb-20 relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-indigo-100 text-indigo-700 text-sm font-bold tracking-wide shadow-sm mb-6">
                        <Zap size={16} /> Complete Toolset
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight mb-6">
                        Every tool you need, <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                            built right in.
                        </span>
                    </h1>
                    <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium">
                        AuraSend is an all-in-one platform. Forget expensive third-party integrations. Everything you need to scale cold outreach is already here.
                    </p>
                </div>

                {/* Feature Sections */}
                <div className="max-w-6xl mx-auto px-6 space-y-32 relative z-10">
                    {FEATURE_SECTIONS.map((section, idx) => (
                        <div key={section.category} className={`flex flex-col lg:flex-row gap-12 items-center ${idx % 2 !== 0 ? 'lg:flex-row-reverse' : ''}`}>
                            <div className="flex-1 w-full relative">
                                <div className={`absolute inset-0 bg-gradient-to-tr from-${section.color}-500/20 to-transparent blur-3xl opacity-50 rounded-full`} />
                                <div className="bg-white border border-slate-100 shadow-2xl rounded-3xl p-10 relative z-10 hover:-translate-y-2 transition-transform duration-300 group">
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 mb-8 transition-colors duration-300 ${colorMap[section.color]?.split(' ').slice(0, 3).join(' ')}`}>
                                        {section.icon}
                                    </div>
                                    <h2 className="text-3xl font-black text-slate-900 mb-6">{section.category}</h2>
                                    <div className="space-y-6">
                                        {section.items.map(item => (
                                            <div key={item.name} className="flex gap-4 items-start">
                                                <div className={`mt-1 shrink-0 w-6 h-6 rounded-full flex items-center justify-center bg-${section.color}-100 text-${section.color}-600`}>
                                                    <CheckCircle2 size={16} />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-900 mb-1">{item.name}</h3>
                                                    <p className="text-sm text-slate-500 leading-relaxed font-medium">{item.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 w-full px-4 lg:px-12 text-center lg:text-left">
                                <h3 className="text-4xl font-black tracking-tight text-slate-900 mb-6">Designed for scale.</h3>
                                <p className="text-lg text-slate-500 leading-relaxed font-medium mb-8">
                                    Our {section.category.toLowerCase()} architecture is built from the ground up to securely handle enterprise-level volume without breaking a sweat.
                                </p>
                                <ul className="space-y-4 text-left inline-block lg:block">
                                    {[1, 2, 3].map(v => (
                                        <li key={v} className="flex items-center gap-3 text-slate-700 font-semibold bg-slate-100/50 py-2 px-4 rounded-xl">
                                            <CheckCircle2 size={18} className="text-indigo-500" /> Enterprise-ready infrastructure
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main CTA */}
                <div className="max-w-5xl mx-auto px-6 mt-32 relative z-10">
                    <div className="bg-slate-950 rounded-[3rem] p-16 md:p-24 text-center text-white relative overflow-hidden shadow-2xl">
                        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-slate-950 to-slate-950"></div>
                        <h2 className="text-5xl font-black tracking-tight mb-8 relative z-10 leading-tight">Ready to activate <br className="hidden md:block" /> your sales engine?</h2>
                        <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto relative z-10">Stop wasting time juggling five different platforms. Start automating your entire outreach pipeline for free.</p>
                        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 relative z-10">
                            <Link href="/login" className="h-16 px-10 bg-white text-slate-900 hover:bg-slate-100 rounded-full font-bold text-lg flex items-center gap-2 transition-all shadow-xl hover:scale-105 w-full sm:w-auto justify-center">
                                Start for Free <ArrowRight size={20} />
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            <MarketingFooter />
        </div>
    );
}
